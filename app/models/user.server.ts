/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_BaseInventoryItem, CS_Inventory } from "@ianlucas/cslib";
import { prisma } from "~/db.server";
import { badRequest, conflict } from "~/response.server";
import { parseInventory } from "~/utils/inventory";
import { getRule } from "./rule.server";

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
  return await prisma.user.findUniqueOrThrow({
    where: { id: userId }
  });
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
  items: CS_BaseInventoryItem[]
) {
  return await prisma.user.update({
    select: {
      syncedAt: true
    },
    data: {
      inventory: JSON.stringify(items),
      syncedAt: new Date()
    },
    where: { id: userId }
  });
}

export async function manipulateUserInventory({
  manipulate,
  rawInventory,
  syncedAt,
  userId
}: {
  manipulate:
    | ((inventory: CS_Inventory) => void)
    | ((inventory: CS_Inventory) => Promise<void>);
  rawInventory: string | null;
  syncedAt?: number;
  userId: string;
}) {
  const inventory = new CS_Inventory({
    items: parseInventory(rawInventory),
    maxItems: await getRule("InventoryMaxItems"),
    storageUnitMaxItems: await getRule("InventoryStorageUnitMaxItems")
  });
  try {
    await manipulate(inventory);
  } catch {
    throw badRequest;
  }
  if (syncedAt !== undefined) {
    const { syncedAt: currentSyncedAt } = await prisma.user.findUniqueOrThrow({
      select: { syncedAt: true },
      where: { id: userId }
    });
    if (syncedAt !== currentSyncedAt.getTime()) {
      throw conflict;
    }
  }
  return await prisma.user.update({
    select: {
      syncedAt: true
    },
    data: {
      syncedAt: new Date(),
      inventory: JSON.stringify(inventory.export())
    },
    where: { id: userId }
  });
}
