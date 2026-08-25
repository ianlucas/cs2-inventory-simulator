/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2Economy,
  CS2_INVENTORY_TIMESTAMP,
  type CS2InventoryItem
} from "@ianlucas/cs2-lib";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { prisma } from "~/db.server";
import { singleton } from "~/singleton.server";
import { safeLoadInventory } from "~/utils/inventory";

const BACKFILL_BATCH_SIZE = 200;
const BACKFILL_INTERVAL_MS = 10 * 60_000;
const ECONOMY_PROJECTION_INTERVAL_MS = 60 * 60_000;
const ECONOMY_PROJECTION_POLL_MS = 2_000;
const ECONOMY_PROJECTION_WAIT_MS = 5 * 60_000;
const ECONOMY_PROJECTION_VERSION = 1;
const LIVE_BATCH_SIZE = 100;
const LIVE_INTERVAL_MS = 60_000;
const META_ID = 1;

type ProjectedInventory = ReturnType<typeof projectInventory>;

let cs2LibVersion: string | undefined;
function getCs2LibVersion() {
  if (cs2LibVersion === undefined) {
    const entry = fileURLToPath(import.meta.resolve("@ianlucas/cs2-lib"));
    const packageJson = readFileSync(
      join(dirname(entry), "..", "package.json"),
      "utf8"
    );
    cs2LibVersion = (JSON.parse(packageJson) as { version: string }).version;
  }
  return cs2LibVersion;
}

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

export function projectInventory(rawInventory: string | null) {
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

export function projectEconomyItems() {
  return CS2Economy.itemsAsArray.map((item) => ({
    altName: item.alternateName,
    base: item.isBase ?? false,
    baseItemId: item.parentId,
    category: item.categoryName,
    collectionKey: item.collectionKey,
    def: item.definitionIndex,
    free: item.isDefault ?? false,
    id: item.id,
    modelKey: item.modelKey,
    name: item.name,
    rarityColor: item.rarityColor,
    type: item.type
  }));
}

async function createMeta() {
  return await prisma.inventoryProjectionState.upsert({
    create: { id: META_ID },
    update: {},
    where: { id: META_ID }
  });
}

export async function isEconomyProjectionCurrent() {
  const meta = await prisma.inventoryProjectionState.findUnique({
    where: { id: META_ID }
  });
  return (
    meta !== null &&
    meta.cs2LibVersion === getCs2LibVersion() &&
    meta.economyProjectionVersion === ECONOMY_PROJECTION_VERSION
  );
}

export async function waitForEconomyProjection(
  timeoutMs = ECONOMY_PROJECTION_WAIT_MS
) {
  const deadline = Date.now() + timeoutMs;
  while (!(await isEconomyProjectionCurrent())) {
    if (Date.now() >= deadline) {
      throw new Error("Economy items were not projected in time.");
    }
    await sleep(ECONOMY_PROJECTION_POLL_MS);
  }
}

export async function syncEconomyProjection() {
  const startedAt = performance.now();
  const version = getCs2LibVersion();
  const meta = await createMeta();
  if (
    meta.cs2LibVersion === version &&
    meta.economyProjectionVersion === ECONOMY_PROJECTION_VERSION
  ) {
    console.log(
      `Inventory economy projection: unchanged in ${Math.round(performance.now() - startedAt)}ms.`
    );
    return;
  }
  const items = projectEconomyItems();
  await prisma.$transaction(
    async (tx) => {
      await tx.economyItem.deleteMany();
      for (let index = 0; index < items.length; index += 1_000) {
        await tx.economyItem.createMany({
          data: items.slice(index, index + 1_000)
        });
      }
      await tx.inventoryProjectionState.update({
        data: {
          cs2LibVersion: version,
          economyProjectionVersion: ECONOMY_PROJECTION_VERSION
        },
        where: { id: META_ID }
      });
      await tx.economyPriceSyncState.updateMany({
        data: { lastSucceededSourceDate: null }
      });
    },
    { maxWait: 30_000, timeout: 180_000 }
  );
  console.log(
    `Inventory economy projection: refreshed ${items.length} items in ${Math.round(performance.now() - startedAt)}ms.`
  );
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

export async function runLiveInventoryProjection(liveSince: Date) {
  const startedAt = performance.now();
  const users = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "User"."id"
    FROM "User"
    LEFT JOIN "UserInventoryProjection"
      ON "UserInventoryProjection"."userId" = "User"."id"
    WHERE "User"."syncedAt" >= ${liveSince}
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
  if (users.length === 0) {
    return;
  }
  console.log(
    `Inventory live projection: selected ${users.length}, projected ${counts.projected}, skipped ${counts.skipped}, failed ${counts.failed} in ${Math.round(performance.now() - startedAt)}ms.`
  );
}

export async function runInventoryBackfill() {
  const startedAt = performance.now();
  const meta = await createMeta();
  if (meta.backfillCompletedAt !== null) {
    return;
  }
  const users = await prisma.user.findMany({
    orderBy: { id: "asc" },
    select: { id: true },
    take: BACKFILL_BATCH_SIZE,
    where:
      meta.backfillCursor === null
        ? undefined
        : { id: { gt: meta.backfillCursor } }
  });
  const counts = await projectUsers(users.map((user) => user.id));
  const lastUser = users.at(-1);
  await prisma.inventoryProjectionState.update({
    data:
      users.length < BACKFILL_BATCH_SIZE
        ? {
            backfillCompletedAt: new Date(),
            backfillCursor: lastUser?.id ?? meta.backfillCursor
          }
        : { backfillCursor: lastUser?.id },
    where: { id: META_ID }
  });
  console.log(
    `Inventory backfill: selected ${users.length}, projected ${counts.projected}, skipped ${counts.skipped}, failed ${counts.failed} in ${Math.round(performance.now() - startedAt)}ms.`
  );
}

function schedule(name: string, intervalMs: number, run: () => Promise<void>) {
  let running = false;
  const invoke = async () => {
    if (running) {
      return;
    }
    running = true;
    try {
      await run();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error.";
      console.log(`${name}: job failed. ${message}`);
    } finally {
      running = false;
    }
  };
  void invoke();
  return setInterval(() => void invoke(), intervalMs);
}

export function scheduleInventoryProjection() {
  singleton("inventoryProjection", () => {
    schedule(
      "Inventory economy projection",
      ECONOMY_PROJECTION_INTERVAL_MS,
      syncEconomyProjection
    );
    const liveSince = new Date(Date.now() - LIVE_INTERVAL_MS);
    schedule("Inventory live projection", LIVE_INTERVAL_MS, () =>
      runLiveInventoryProjection(liveSince)
    );
    schedule("Inventory backfill", BACKFILL_INTERVAL_MS, runInventoryBackfill);
    return true;
  });
}
