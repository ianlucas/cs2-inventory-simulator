/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2InventoryLoadChanges } from "@ianlucas/cs2-lib";
import { prisma } from "~/db.server";

export async function recordInventoryWipe(userId: string, inventory: string) {
  try {
    await prisma.inventoryRecovery.create({
      data: {
        inventory,
        reason: "wipe",
        userId
      }
    });
  } catch (error) {
    console.error(`Failed to record inventory wipe for user ${userId}.`, error);
  }
}

export async function recordInventoryLoadChanges(
  userId: string,
  inventory: string,
  changes: CS2InventoryLoadChanges
) {
  try {
    await prisma.inventoryRecovery.create({
      data: {
        changes: JSON.stringify(changes),
        inventory,
        reason: "load-change",
        userId
      }
    });
  } catch (error) {
    console.error(
      `Failed to record inventory load changes for user ${userId}.`,
      error
    );
  }
}

export function hasInventoryLoadChanges(
  changes: CS2InventoryLoadChanges | undefined
): changes is CS2InventoryLoadChanges {
  return (
    changes !== undefined &&
    (changes.migratedFrom !== undefined ||
      changes.dropped.length > 0 ||
      changes.repairedUids.length > 0)
  );
}
