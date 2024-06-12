/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Inventory } from "@ianlucas/cs2-lib";
import { prisma } from "~/db.server";
import { badRequest, conflict } from "~/responses.server";
import { parseInventory } from "~/utils/inventory";
import { isValidDomain } from "./domain.server";
import { getRule } from "./rule.server";

export async function getUserInventory(domainHostname: string, userId: string) {
  if (await isValidDomain(domainHostname)) {
    return (
      (
        await prisma.userDomainInventory.findFirst({
          where: { userId, domainHostname }
        })
      )?.inventory ?? null
    );
  }
  return (
    (await prisma.user.findFirst({ where: { id: userId } }))?.inventory ?? null
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

export async function findUniqueUser(domainHostname: string, userId: string) {
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
    inventory: await getUserInventory(domainHostname, userId),
    syncedAt: await getUserSyncedAt(domainHostname, userId)
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
  domainHostname: string,
  userId: string,
  inventory: string
) {
  const syncedAt = new Date();
  if (await isValidDomain(domainHostname)) {
    return await prisma.userDomainInventory.upsert({
      select: {
        syncedAt: true
      },
      create: {
        domainHostname,
        inventory,
        syncedAt,
        userId
      },
      update: {
        inventory,
        syncedAt
      },
      where: {
        domainHostname_userId: {
          domainHostname,
          userId
        }
      }
    });
  }
  return await prisma.user.update({
    select: {
      syncedAt: true
    },
    data: {
      inventory,
      syncedAt
    },
    where: {
      id: userId
    }
  });
}

export async function getUserSyncedAt(domainHostname: string, userId: string) {
  if (await isValidDomain(domainHostname)) {
    const syncedAt = (
      await prisma.userDomainInventory.findFirst({
        select: { syncedAt: true },
        where: { userId, domainHostname }
      })
    )?.syncedAt;
    if (syncedAt !== undefined) {
      return syncedAt;
    }
  }
  return (
    await prisma.user.findFirstOrThrow({
      select: { syncedAt: true },
      where: { id: userId }
    })
  ).syncedAt;
}

export async function manipulateUserInventory({
  domainHostname,
  manipulate,
  rawInventory,
  syncedAt,
  userId
}: {
  domainHostname: string;
  manipulate:
    | ((inventory: CS2Inventory) => void)
    | ((inventory: CS2Inventory) => Promise<void>);
  rawInventory: string | null;
  syncedAt?: number;
  userId: string;
}) {
  const inventory = new CS2Inventory({
    data: parseInventory(rawInventory),
    maxItems: await getRule("inventoryMaxItems", userId),
    storageUnitMaxItems: await getRule("inventoryStorageUnitMaxItems", userId)
  });
  try {
    await manipulate(inventory);
  } catch {
    throw badRequest;
  }
  if (syncedAt !== undefined) {
    const currentSyncedAt = await getUserSyncedAt(domainHostname, userId);
    if (syncedAt !== currentSyncedAt.getTime()) {
      throw conflict;
    }
  }
  return await updateUserInventory(
    domainHostname,
    userId,
    inventory.stringify()
  );
}
