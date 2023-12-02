/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Economy } from "@ianlucas/cslib";
import { prisma } from "~/db.server";
import { parseInventory } from "~/utils/inventory";

export async function UserInventoryCleanup() {
  console.log("[pending] user-inventory-cleanup...");
  const users = await prisma.user.findMany({
    select: {
      id: true
    }
  });
  let count = 0;
  for (const { id } of users) {
    const { inventory } = await prisma.user.findUniqueOrThrow({
      select: {
        inventory: true
      },
      where: { id }
    });
    if (inventory) {
      const parsed = parseInventory(inventory);
      const filtered = parsed.filter((item) => CS_Economy.itemMap.has(item.id));
      if (parsed.length !== filtered.length) {
        count += 1;
        await prisma.user.update({
          data: { inventory: JSON.stringify(filtered) },
          where: { id }
        });
      }
    }
  }
  console.log(`[completed] user-inventory-cleanup (updated ${count} users).`);
}
