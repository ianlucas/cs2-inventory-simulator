/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_InventoryItem, CS_MutableInventory } from "@ianlucas/cslib";
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
  manipulate: (inventory: CS_MutableInventory) => void
) {
  const csInventory = new CS_MutableInventory(
    parseInventory(rawInventory),
    MAX_INVENTORY_ITEMS
  );
  manipulate(csInventory);
  return await prisma.user.update({
    data: {
      syncedAt: new Date(),
      inventory: JSON.stringify(csInventory.getItems())
    },
    where: { id: userId }
  });
}
