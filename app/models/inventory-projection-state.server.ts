/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { prisma } from "~/db.server";

export const INVENTORY_PROJECTION_STATE_ID = 1;

export async function ensureInventoryProjectionState() {
  // Prisma runs an upsert with an empty update as read-then-insert, which races
  // between jobs on first boot; skipDuplicates uses INSERT ... ON CONFLICT.
  await prisma.inventoryProjectionState.createMany({
    data: { id: INVENTORY_PROJECTION_STATE_ID },
    skipDuplicates: true
  });
  return await prisma.inventoryProjectionState.findUniqueOrThrow({
    where: { id: INVENTORY_PROJECTION_STATE_ID }
  });
}
