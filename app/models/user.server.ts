/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Inventory, CS_InventoryItem } from "@ianlucas/cslib";
import SteamAPI from "steamapi";
import { prisma } from "~/db.server";
import {
  MAX_INVENTORY_ITEMS,
  MAX_INVENTORY_STORAGE_UNIT_ITEMS
} from "~/env.server";
import { parseInventory } from "~/utils/inventory";

export async function upsertUser(user: SteamAPI.PlayerSummary) {
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
  items: CS_InventoryItem[]
) {
  return await prisma.user.update({
    data: {
      inventory: JSON.stringify(items),
      syncedAt: new Date()
    },
    where: { id: userId }
  });
}

export async function manipulateUserInventory(
  userId: string,
  rawInventory: string | null,
  manipulate: (inventory: CS_Inventory) => void
) {
  const inventory = new CS_Inventory({
    items: parseInventory(rawInventory),
    limit: MAX_INVENTORY_ITEMS,
    storageUnitLimit: MAX_INVENTORY_STORAGE_UNIT_ITEMS
  });
  manipulate(inventory);
  return await prisma.user.update({
    data: {
      syncedAt: new Date(),
      inventory: JSON.stringify(inventory.getAll())
    },
    where: { id: userId }
  });
}
