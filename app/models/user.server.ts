/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_BaseInventoryItem, CS_Inventory } from "@ianlucas/cs2-lib";
import { prisma } from "~/db.server";
import { badRequest, conflict } from "~/response.server";
import { parseInventory } from "~/utils/inventory";
import { getRule } from "./rule.server";

export async function upsertUser(
  domainId: string,
  user: {
    avatar: { medium: string };
    nickname: string;
    steamID: string;
  }
) {
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
        id_domainId: {
          id: user.steamID,
          domainId
        }
      }
    })
  ).id;
}

export async function findUniqueUser(domainId: string, userId: string) {
  return await prisma.user.findUniqueOrThrow({
    where: {
      id_domainId: {
        id: userId,
        domainId
      }
    }
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
  domainId: string,
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
    where: {
      id_domainId: {
        id: userId,
        domainId
      }
    }
  });
}

export async function manipulateUserInventory({
  domainId,
  manipulate,
  rawInventory,
  syncedAt,
  userId
}: {
  domainId: string;
  manipulate:
    | ((inventory: CS_Inventory) => void)
    | ((inventory: CS_Inventory) => Promise<void>);
  rawInventory: string | null;
  syncedAt?: number;
  userId: string;
}) {
  const inventory = new CS_Inventory({
    items: parseInventory(rawInventory),
    maxItems: await getRule("inventoryMaxItems", userId),
    storageUnitMaxItems: await getRule("inventoryStorageUnitMaxItems", userId)
  });
  try {
    await manipulate(inventory);
  } catch {
    throw badRequest;
  }
  if (syncedAt !== undefined) {
    const { syncedAt: currentSyncedAt } = await prisma.user.findUniqueOrThrow({
      select: { syncedAt: true },
      where: { id_domainId: { id: userId, domainId } }
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
    where: { id_domainId: { id: userId, domainId } }
  });
}
