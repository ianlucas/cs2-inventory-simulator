/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { prisma } from "~/db.server";

export async function recordInventoryWipe(userId: string, inventory: string) {
  try {
    await prisma.inventoryWipeAudit.create({
      data: {
        inventory,
        userId
      }
    });
  } catch (error) {
    console.error(`Failed to audit inventory wipe for user ${userId}.`, error);
  }
}
