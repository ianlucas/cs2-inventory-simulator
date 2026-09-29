/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2InventoryLoadChanges } from "@ianlucas/cs2-lib";
import { prisma } from "~/db.server";
import { logError } from "~/utils/monitoring";

export async function recordInventoryWipe(
  userId: string,
  rawInventory: string
) {
  try {
    await prisma.userInventoryRecovery.create({
      data: {
        rawInventory,
        reason: "wipe",
        userId
      }
    });
  } catch (error) {
    logError("Failed to record an inventory wipe.", {
      error,
      extra: { userId }
    });
  }
}

export async function recordInventoryLoadChanges(
  userId: string,
  rawInventory: string,
  changes: CS2InventoryLoadChanges
) {
  try {
    await prisma.userInventoryRecovery.create({
      data: {
        changes: JSON.stringify(changes),
        rawInventory,
        reason: "load-change",
        userId
      }
    });
  } catch (error) {
    logError("Failed to record inventory load changes.", {
      error,
      extra: { userId }
    });
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
