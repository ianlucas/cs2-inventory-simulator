/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Economy } from "@ianlucas/cslib";
import { prisma } from "~/db.server";
import { parseInventory } from "~/utils/inventory";

export async function UserInventoryCleanUp() {
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
      let removedStickers = false;
      const parsed = parseInventory(inventory);
      const filtered = parsed
        // Remove non existent items.
        .filter((item) => CS_Economy.itemMap.has(item.id))
        // Remove stickers from c4.
        .map((inventoryItem) => {
          const item = CS_Economy.getById(inventoryItem.id);
          if (item.category !== "c4") {
            return item;
          }
          if (inventoryItem.stickers || inventoryItem.stickerswear) {
            removedStickers = true;
          }
          return {
            ...inventoryItem,
            stickers: undefined,
            stickerswear: undefined
          };
        });
      if (parsed.length !== filtered.length || removedStickers) {
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
