/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Inventory, assert } from "@ianlucas/cs2-lib";
import { prisma } from "~/db.server";
import type { Prisma } from "~/generated/prisma/client";
import { Loadout, detachItems, getInventoryItemIds } from "~/shared/loadout";
import {
  LoadoutAction,
  UserLoadouts,
  applyLoadoutAction,
  detachRemovedItems
} from "~/shared/user-loadouts";

const LOADOUT_DATA_VERSION = 1;

type Transaction = Prisma.TransactionClient;

function parseLoadout(data: string): Loadout {
  const { version, ...loadout } = JSON.parse(data);
  assert(version === LOADOUT_DATA_VERSION);
  return loadout;
}

function stringifyLoadout(loadout: Loadout) {
  return JSON.stringify({ version: LOADOUT_DATA_VERSION, ...loadout });
}

export async function getUserLoadouts(
  userId: string,
  tx: Transaction = prisma
): Promise<UserLoadouts> {
  const { activeLoadoutId, loadouts } = await tx.user.findUniqueOrThrow({
    select: {
      activeLoadoutId: true,
      loadouts: {
        orderBy: { createdAt: "asc" },
        select: { data: true, id: true, name: true }
      }
    },
    where: { id: userId }
  });
  return {
    activeLoadoutId,
    loadouts: loadouts.map(({ data, id, name }) => ({
      id,
      loadout: parseLoadout(data),
      name
    }))
  };
}

export async function getActiveUserLoadout(
  userId: string,
  inventory: CS2Inventory
) {
  const { activeLoadout } = await prisma.user.findUniqueOrThrow({
    select: { activeLoadout: { select: { data: true } } },
    where: { id: userId }
  });
  return activeLoadout !== null
    ? detachItems(
        parseLoadout(activeLoadout.data),
        getInventoryItemIds(inventory),
        new Map()
      )
    : undefined;
}

async function saveUserLoadouts(
  tx: Transaction,
  userId: string,
  previous: UserLoadouts,
  next: UserLoadouts
) {
  const previousById = new Map(
    previous.loadouts.map((loadout) => [loadout.id, loadout])
  );
  const nextIds = new Set(next.loadouts.map(({ id }) => id));
  const deletedIds = [...previousById.keys()].filter((id) => !nextIds.has(id));
  if (deletedIds.length > 0) {
    await tx.userLoadout.deleteMany({
      where: { id: { in: deletedIds }, userId }
    });
  }
  for (const current of next.loadouts) {
    const data = {
      data: stringifyLoadout(current.loadout),
      name: current.name
    };
    const previousLoadout = previousById.get(current.id);
    if (previousLoadout === undefined) {
      await tx.userLoadout.create({
        data: { ...data, id: current.id, userId }
      });
    } else if (previousLoadout !== current) {
      await tx.userLoadout.update({ data, where: { id: current.id, userId } });
    }
  }
  if (next.activeLoadoutId !== previous.activeLoadoutId) {
    await tx.user.update({
      data: { activeLoadoutId: next.activeLoadoutId },
      where: { id: userId }
    });
  }
}

// Loadouts are only read from the database when an action or a removed item
// touches them.
export function createUserLoadoutsDraft(
  tx: Transaction,
  userId: string,
  inventory: CS2Inventory
) {
  let itemIds = getInventoryItemIds(inventory);
  let initial: UserLoadouts | undefined;
  let state: UserLoadouts | undefined;

  async function load() {
    if (state === undefined) {
      state = initial = await getUserLoadouts(userId, tx);
    }
    return state;
  }

  return {
    async apply(action: LoadoutAction, maxLoadouts: number) {
      state = applyLoadoutAction(await load(), action, {
        inventory,
        maxLoadouts
      });
    },

    async detachRemovedItems(force = false) {
      const previousItemIds = itemIds;
      itemIds = getInventoryItemIds(inventory);
      const isRemoved = [...previousItemIds].some(
        ([uid, id]) => itemIds.get(uid) !== id
      );
      if (force || isRemoved) {
        state = detachRemovedItems(await load(), itemIds, previousItemIds);
      }
    },

    async save() {
      if (initial !== undefined && state !== undefined && state !== initial) {
        await saveUserLoadouts(tx, userId, initial, state);
      }
    }
  };
}

export type UserLoadoutsDraft = ReturnType<typeof createUserLoadoutsDraft>;
