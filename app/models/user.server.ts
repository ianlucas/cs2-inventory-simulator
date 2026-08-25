/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Inventory, CS2InventorySpec } from "@ianlucas/cs2-lib";
import { prisma } from "~/db.server";
import { badRequest, conflict } from "~/responses.server";
import {
  hasInventoryContent,
  loadOrCreateInventory,
  safeLoadInventory
} from "~/utils/inventory";
import {
  hasInventoryLoadChanges,
  recordInventoryLoadChanges,
  recordInventoryWipe
} from "./inventory-recovery.server";
import { inventoryMaxItems, inventoryStorageUnitMaxItems } from "./rule.server";

export async function getUserInventoryOptions(userId: string) {
  return {
    maxItems: await inventoryMaxItems.for(userId).get(),
    storageUnitMaxItems: await inventoryStorageUnitMaxItems.for(userId).get()
  };
}

export async function loadOrCreateUserInventory(
  userId: string,
  rawInventory: string | null,
  options?: Partial<CS2InventorySpec>
) {
  return loadOrCreateInventory(
    rawInventory,
    options ?? (await getUserInventoryOptions(userId))
  );
}

export async function getUserInventory(userId: string) {
  return (
    (
      await prisma.user.findFirst({
        select: { rawInventory: true },
        where: { id: userId }
      })
    )?.rawInventory ?? null
  );
}

export async function upsertUser(user: {
  avatar: { medium: string };
  nickname: string;
  steamID: string;
}) {
  const data = {
    avatar: user.avatar.medium,
    name: user.nickname
  };
  return (
    await prisma.user.upsert({
      select: {
        id: true
      },
      create: {
        id: user.steamID,
        ...data
      },
      update: {
        ...data
      },
      where: {
        id: user.steamID
      }
    })
  ).id;
}

export async function findUniqueUser(userId: string) {
  return {
    ...(await prisma.user.findUniqueOrThrow({
      select: {
        avatar: true,
        createdAt: true,
        id: true,
        name: true,
        updatedAt: true
      },
      where: {
        id: userId
      }
    })),
    inventory: await getUserInventory(userId),
    syncedAt: await getUserSyncedAt(userId)
  };
}

export async function existsUser(userId: string) {
  return (
    (await prisma.user.findFirst({
      select: {
        id: true
      },
      where: { id: userId }
    })) !== null
  );
}

export async function updateUserInventory(
  userId: string,
  rawInventory: string
) {
  const syncedAt = new Date();
  return await prisma.user.update({
    select: {
      syncedAt: true
    },
    data: {
      rawInventory,
      syncedAt
    },
    where: {
      id: userId
    }
  });
}

export async function touchLastSeen(userId: string, throttleMs = 3_600_000) {
  await prisma.user.updateMany({
    data: { lastSeenAt: new Date() },
    where: {
      id: userId,
      lastSeenAt: { lt: new Date(Date.now() - throttleMs) }
    }
  });
}

export async function getUserSyncedAt(userId: string) {
  return (
    await prisma.user.findFirstOrThrow({
      select: { syncedAt: true },
      where: { id: userId }
    })
  ).syncedAt;
}

export async function manipulateUserInventory({
  manipulate,
  syncedAt,
  userId
}: {
  manipulate:
    | ((inventory: CS2Inventory) => void)
    | ((inventory: CS2Inventory) => Promise<void>);
  syncedAt?: number;
  userId: string;
}) {
  const options = await getUserInventoryOptions(userId);
  return await prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
      const { rawInventory, syncedAt: currentSyncedAt } =
        await tx.user.findUniqueOrThrow({
          select: { rawInventory: true, syncedAt: true },
          where: { id: userId }
        });
      const loadedInventory = safeLoadInventory(rawInventory, options);
      const wipedInventory =
        loadedInventory === undefined && hasInventoryContent(rawInventory)
          ? rawInventory
          : undefined;
      const inventory = loadedInventory ?? new CS2Inventory(options);
      try {
        await manipulate(inventory);
      } catch {
        throw badRequest;
      }
      if (syncedAt !== undefined && syncedAt !== currentSyncedAt.getTime()) {
        throw conflict;
      }
      if (wipedInventory !== undefined) {
        await recordInventoryWipe(userId, wipedInventory);
      } else if (
        rawInventory !== null &&
        hasInventoryLoadChanges(inventory.loadChanges)
      ) {
        await recordInventoryLoadChanges(
          userId,
          rawInventory,
          inventory.loadChanges
        );
      }
      return await tx.user.update({
        select: { syncedAt: true },
        data: { rawInventory: inventory.stringify(), syncedAt: new Date() },
        where: { id: userId }
      });
    },
    { timeout: 10_000 }
  );
}

export async function getUserBasicData(userId: string) {
  return (
    (await prisma.user.findFirst({
      select: {
        avatar: true,
        name: true
      },
      where: {
        id: userId
      }
    })) || undefined
  );
}
