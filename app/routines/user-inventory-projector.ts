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
import type { Prisma } from "~/generated/prisma/client";
import { safeLoadInventory } from "~/shared/inventory";
import { logError } from "~/shared/monitoring";
import { Job } from "~/shared/scheduling";
import { singleton } from "~/singleton.server";

const BACKFILL_BATCH_SIZE = 200;
const BACKFILL_INTERVAL_MS = 10 * 60_000;
const LIVE_BATCH_SIZE = 100;
// Syncs stamp syncedAt before they commit, and hosts' clocks drift, so the live
// cursor never moves past users who synced this recently.
const LIVE_CURSOR_LAG_MS = 60_000;
const LIVE_INTERVAL_MS = 60_000;
const REPORTED_FAILED_USER_IDS = 10;
const STATE_ID = 1;

type ProjectedInventory = {
  items: Omit<Prisma.UserInventoryItemCreateManyInput, "userId">[];
  keychains: Prisma.UserInventoryItemKeychainCreateManyInput[];
  patches: Prisma.UserInventoryItemPatchCreateManyInput[];
  stickers: Prisma.UserInventoryItemStickerCreateManyInput[];
};

function toDate(timestamp: number | undefined) {
  return timestamp === undefined
    ? undefined
    : new Date(CS2_INVENTORY_TIMESTAMP + timestamp * 1_000);
}

function projectInventoryItem(
  item: CS2InventoryItem,
  containerUid: number | undefined,
  projected: ProjectedInventory
) {
  const { items, keychains, patches, stickers } = projected;
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
    projectInventoryItem(storedItem, item.uid, projected);
  }
}

function projectInventory(rawInventory: string | null) {
  const projected: ProjectedInventory = {
    items: [],
    keychains: [],
    patches: [],
    stickers: []
  };
  const inventory = safeLoadInventory(rawInventory);
  for (const item of inventory?.getAll() ?? []) {
    projectInventoryItem(item, undefined, projected);
  }
  return projected;
}

type ProjectionResult = "projected" | "skipped";

async function ensureState() {
  // Prisma runs an upsert with an empty update as read-then-insert, which races
  // between jobs on first boot; skipDuplicates uses INSERT ... ON CONFLICT.
  await prisma.userInventoryProjectionState.createMany({
    data: { id: STATE_ID },
    skipDuplicates: true
  });
  return await prisma.userInventoryProjectionState.findUniqueOrThrow({
    where: { id: STATE_ID }
  });
}

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
  // Prisma runs an upsert with an empty update as read-then-insert, which races
  // when both jobs pick up the same user; skipDuplicates uses ON CONFLICT.
  await prisma.userInventoryProjection.createMany({
    data: { userId },
    skipDuplicates: true
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
}

/**
 * Projects each user in turn. A failed user is marked so neither job retries
 * them before their next sync, and the batch reports its first error.
 */
async function projectUsers(jobName: string, userIds: string[]) {
  const counts = { failed: 0, projected: 0, skipped: 0 };
  const failures: Array<{ error: unknown; userId: string }> = [];
  for (const userId of userIds) {
    try {
      counts[await projectUserInventory(userId)] += 1;
    } catch (error) {
      counts.failed += 1;
      failures.push({ error, userId });
      try {
        await markProjectionFailed(userId);
      } catch {
        // The batch report below already covers this user.
      }
    }
  }
  if (failures.length > 0) {
    logError(`${jobName}: some users failed to project.`, {
      error: failures[0].error,
      extra: {
        ...counts,
        failedUserIds: failures
          .slice(0, REPORTED_FAILED_USER_IDS)
          .map(({ userId }) => userId)
      }
    });
  }
}

/**
 * Keeps the per-user inventory tables in sync with `User.rawInventory`: a live
 * job projects users as they sync, resuming from a stored cursor, and a
 * backfill job walks every user once.
 */
class UserInventoryProjector {
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
    const state = await ensureState();
    const settledBefore = new Date(Date.now() - LIVE_CURSOR_LAG_MS);
    const users = await prisma.$queryRaw<Array<{ id: string; syncedAt: Date }>>`
      SELECT "User"."id", "User"."syncedAt"
      FROM "User"
      LEFT JOIN "UserInventoryProjection"
        ON "UserInventoryProjection"."userId" = "User"."id"
      WHERE "User"."syncedAt" >= ${state.liveCursor ?? settledBefore}
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
    await projectUsers(
      this.liveJob.name,
      users.map((user) => user.id)
    );
    // Everyone who synced before the oldest pending user was already handled.
    const oldestPending = users.at(0)?.syncedAt ?? settledBefore;
    await prisma.userInventoryProjectionState.update({
      data: {
        liveCursor:
          oldestPending < settledBefore ? oldestPending : settledBefore
      },
      where: { id: STATE_ID }
    });
  }

  private async backfill() {
    const state = await ensureState();
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
    await projectUsers(
      this.backfillJob.name,
      users.map((user) => user.id)
    );
    const lastUser = users.at(-1);
    await prisma.userInventoryProjectionState.update({
      data:
        users.length < BACKFILL_BATCH_SIZE
          ? {
              backfillCompletedAt: new Date(),
              backfillCursor: lastUser?.id ?? state.backfillCursor
            }
          : { backfillCursor: lastUser?.id },
      where: { id: STATE_ID }
    });
  }
}

export const userInventoryProjector = singleton(
  "userInventoryProjector",
  () => new UserInventoryProjector()
);
