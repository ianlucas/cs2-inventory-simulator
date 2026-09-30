/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2_INVENTORY_TIMESTAMP,
  type CS2InventoryItem
} from "@ianlucas/cs2-lib";
import { randomUUID } from "node:crypto";
import { prisma } from "~/db.server";
import {
  ensureInventoryProjectionState,
  INVENTORY_PROJECTION_STATE_ID
} from "~/models/inventory-projection-state.server";
import { safeLoadInventory } from "~/shared/inventory";
import { logError } from "~/shared/monitoring";
import { Job } from "~/shared/scheduling";
import { singleton } from "~/singleton.server";

const BACKFILL_BATCH_SIZE = 200;
const BACKFILL_INTERVAL_MS = 10 * 60_000;
const LIVE_BATCH_SIZE = 100;
const LIVE_INTERVAL_MS = 60_000;

type ProjectedInventory = ReturnType<typeof projectInventory>;

function toDate(timestamp: number | undefined) {
  return timestamp === undefined
    ? undefined
    : new Date(CS2_INVENTORY_TIMESTAMP + timestamp * 1_000);
}

function projectInventoryItem(
  item: CS2InventoryItem,
  containerUid: number | undefined,
  items: ProjectedInventory["items"],
  stickers: ProjectedInventory["stickers"],
  patches: ProjectedInventory["patches"],
  keychains: ProjectedInventory["keychains"]
) {
  const id = randomUUID();
  const inventoryKey =
    containerUid === undefined
      ? `inventory:${item.uid}`
      : `storage:${containerUid}:${item.uid}`;
  items.push({
    charges: item.charges,
    containerUid,
    equipped: item.equipped ?? false,
    equippedCT: item.equippedCT ?? false,
    equippedT: item.equippedT ?? false,
    id,
    inventoryKey,
    itemId: item.id,
    itemUpdatedAt: toDate(item.updatedAt),
    nameTag: item.nameTag,
    seed: item.seed,
    sourceContainerId: item.containerId,
    statTrak: item.statTrak,
    uid: item.uid,
    wear: item.wear
  });
  for (const [slot, sticker] of item.someStickers()) {
    stickers.push({
      id: randomUUID(),
      itemId: sticker.id,
      rotation: sticker.rotation,
      schema: sticker.schema,
      slot,
      userInventoryItemId: id,
      wear: sticker.wear,
      x: sticker.x,
      y: sticker.y
    });
  }
  for (const [slot, patch] of item.somePatches()) {
    patches.push({
      id: randomUUID(),
      itemId: patch,
      slot,
      userInventoryItemId: id
    });
  }
  for (const [slot, keychain] of item.someKeychains()) {
    keychains.push({
      id: randomUUID(),
      itemId: keychain.id,
      seed: keychain.seed,
      slot,
      userInventoryItemId: id,
      x: keychain.x,
      y: keychain.y,
      z: keychain.z
    });
  }
  for (const storedItem of item.storage?.values() ?? []) {
    projectInventoryItem(
      storedItem,
      item.uid,
      items,
      stickers,
      patches,
      keychains
    );
  }
}

function projectInventory(rawInventory: string | null) {
  const items: Array<{
    charges?: number;
    containerUid?: number;
    equipped: boolean;
    equippedCT: boolean;
    equippedT: boolean;
    id: string;
    inventoryKey: string;
    itemId: number;
    itemUpdatedAt?: Date;
    nameTag?: string;
    seed?: number;
    sourceContainerId?: number;
    statTrak?: number;
    uid: number;
    wear?: number;
  }> = [];
  const stickers: Array<{
    id: string;
    itemId: number;
    rotation?: number;
    schema?: number;
    slot: number;
    userInventoryItemId: string;
    wear?: number;
    x?: number;
    y?: number;
  }> = [];
  const patches: Array<{
    id: string;
    itemId: number;
    slot: number;
    userInventoryItemId: string;
  }> = [];
  const keychains: Array<{
    id: string;
    itemId: number;
    seed?: number;
    slot: number;
    userInventoryItemId: string;
    x?: number;
    y?: number;
    z?: number;
  }> = [];
  const inventory = safeLoadInventory(rawInventory);
  for (const item of inventory?.getAll() ?? []) {
    projectInventoryItem(item, undefined, items, stickers, patches, keychains);
  }
  return { items, stickers, patches, keychains };
}

type ProjectionResult = "failed" | "projected" | "skipped";

async function markProjectionFailed(userId: string) {
  const user = await prisma.user.findUnique({
    select: { syncedAt: true },
    where: { id: userId }
  });
  if (user === null) {
    return;
  }
  await prisma.userInventoryProjection.upsert({
    create: { failedUserSyncedAt: user.syncedAt, userId },
    update: { failedUserSyncedAt: user.syncedAt },
    where: { userId }
  });
}

async function projectUserInventory(userId: string): Promise<ProjectionResult> {
  try {
    await prisma.userInventoryProjection.upsert({
      create: { userId },
      update: {},
      where: { userId }
    });
    return await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT "userId"
        FROM "UserInventoryProjection"
        WHERE "userId" = ${userId}
        FOR UPDATE
      `;
      const user = await tx.user.findUnique({
        select: { rawInventory: true, syncedAt: true },
        where: { id: userId }
      });
      const projection = await tx.userInventoryProjection.findUniqueOrThrow({
        where: { userId }
      });
      if (user === null) {
        return "skipped";
      }
      const syncedAt = user.syncedAt.getTime();
      if (
        projection.projectedUserSyncedAt?.getTime() === syncedAt ||
        projection.failedUserSyncedAt?.getTime() === syncedAt
      ) {
        return "skipped";
      }
      const inventory = projectInventory(user.rawInventory);
      await tx.userInventoryItem.deleteMany({ where: { userId } });
      if (inventory.items.length > 0) {
        await tx.userInventoryItem.createMany({
          data: inventory.items.map((item) => ({ ...item, userId }))
        });
      }
      if (inventory.stickers.length > 0) {
        await tx.userInventoryItemSticker.createMany({
          data: inventory.stickers
        });
      }
      if (inventory.patches.length > 0) {
        await tx.userInventoryItemPatch.createMany({ data: inventory.patches });
      }
      if (inventory.keychains.length > 0) {
        await tx.userInventoryItemKeychain.createMany({
          data: inventory.keychains
        });
      }
      await tx.userInventoryProjection.update({
        data: {
          failedUserSyncedAt: null,
          projectedAt: new Date(),
          projectedUserSyncedAt: user.syncedAt
        },
        where: { userId }
      });
      return "projected";
    });
  } catch {
    try {
      await markProjectionFailed(userId);
    } catch {
      // The aggregate job result still exposes a failed projection without polluting stdout.
    }
    return "failed";
  }
}

async function projectUsers(userIds: string[]) {
  const counts = { failed: 0, projected: 0, skipped: 0 };
  for (const userId of userIds) {
    counts[await projectUserInventory(userId)] += 1;
  }
  return counts;
}

/**
 * Keeps the per-user inventory tables in sync with `User.rawInventory`: a live
 * job projects users who synced since boot, and a backfill job walks every
 * user once.
 */
class UserInventoryProjector {
  private readonly liveSince = new Date(Date.now() - LIVE_INTERVAL_MS);
  private readonly liveJob = new Job(
    "User inventory live projection",
    LIVE_INTERVAL_MS,
    () => this.projectLive()
  );
  private readonly backfillJob = new Job(
    "User inventory backfill",
    BACKFILL_INTERVAL_MS,
    () => this.backfill()
  );

  start() {
    this.liveJob.start();
    this.backfillJob.start();
  }

  private async projectLive() {
    const users = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "User"."id"
      FROM "User"
      LEFT JOIN "UserInventoryProjection"
        ON "UserInventoryProjection"."userId" = "User"."id"
      WHERE "User"."syncedAt" >= ${this.liveSince}
        AND (
          "UserInventoryProjection"."userId" IS NULL
          OR (
            "UserInventoryProjection"."projectedUserSyncedAt" IS DISTINCT FROM "User"."syncedAt"
            AND "UserInventoryProjection"."failedUserSyncedAt" IS DISTINCT FROM "User"."syncedAt"
          )
        )
      ORDER BY "User"."syncedAt", "User"."id"
      LIMIT ${LIVE_BATCH_SIZE}
    `;
    const counts = await projectUsers(users.map((user) => user.id));
    if (counts.failed > 0) {
      logError(
        "User inventory live projection: some users failed to project.",
        { extra: counts }
      );
    }
  }

  private async backfill() {
    const state = await ensureInventoryProjectionState();
    if (state.backfillCompletedAt !== null) {
      return;
    }
    const users = await prisma.user.findMany({
      orderBy: { id: "asc" },
      select: { id: true },
      take: BACKFILL_BATCH_SIZE,
      where:
        state.backfillCursor === null
          ? undefined
          : { id: { gt: state.backfillCursor } }
    });
    const counts = await projectUsers(users.map((user) => user.id));
    const lastUser = users.at(-1);
    await prisma.inventoryProjectionState.update({
      data:
        users.length < BACKFILL_BATCH_SIZE
          ? {
              backfillCompletedAt: new Date(),
              backfillCursor: lastUser?.id ?? state.backfillCursor
            }
          : { backfillCursor: lastUser?.id },
      where: { id: INVENTORY_PROJECTION_STATE_ID }
    });
    if (counts.failed > 0) {
      logError("User inventory backfill: some users failed to project.", {
        extra: counts
      });
    }
  }
}

export const userInventoryProjector = singleton(
  "userInventoryProjector",
  () => new UserInventoryProjector()
);
