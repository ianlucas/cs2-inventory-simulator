/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Inventory, CS_InventoryItem } from "@ianlucas/cslib";
import SteamAPI from "steamapi";
import { prisma } from "~/db.server";
import { MAX_INVENTORY_ITEMS } from "~/env.server";
import { parseInventory } from "~/utils/inventory";

export async function upsertUser(user: SteamAPI.PlayerSummary) {
  const data = {
    avatar: user.avatar.medium,
    name: user.nickname
  };
  return (await prisma.user.upsert({
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
  })).id;
}

export async function findUniqueUser(userId: string) {
  return await prisma.user.findUniqueOrThrow({
    where: { id: userId }
  });
}

export async function updateUserInventory(
  userId: string,
  inventory: CS_InventoryItem[]
) {
  return await prisma.user.update({
    data: {
      inventory: JSON.stringify(inventory),
      syncedAt: new Date()
    },
    where: { id: userId }
  });
}

export async function editUserInventory(
  userId: string,
  inventory: string | null,
  callback: (inventory: CS_Inventory) => CS_Inventory
) {
  const items = parseInventory(inventory);
  return await prisma.user.update({
    data: {
      syncedAt: new Date(),
      inventory: JSON.stringify(
        callback(new CS_Inventory(items, MAX_INVENTORY_ITEMS))
          .getItems()
      )
    },
    where: { id: userId }
  });
}
