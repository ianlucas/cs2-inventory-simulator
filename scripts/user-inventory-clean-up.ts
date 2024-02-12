/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS_Economy,
  CS_ITEMS,
  CS_NO_STICKER,
  CS_NO_STICKER_WEAR
} from "@ianlucas/cslib";
import { basename } from "path";
import { prisma } from "~/db.server";
import { parseInventory } from "~/utils/inventory";

CS_Economy.initialize(CS_ITEMS);

async function main() {
  console.log("[running] user-inventory-clean-up...");
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
      let removedC4Stickers = false;
      let stickerNullToZero = false;
      const parsed = parseInventory(inventory);
      const filtered = parsed
        // Remove non existent items.
        .filter((item) => CS_Economy.itemMap.has(item.id))
        // Remove stickers from c4.
        .map((inventoryItem) => {
          const item = CS_Economy.getById(inventoryItem.id);
          if (item.category !== "c4") {
            return inventoryItem;
          }
          if (inventoryItem.stickers || inventoryItem.stickerswear) {
            removedC4Stickers = true;
            return {
              ...inventoryItem,
              stickers: undefined,
              stickerswear: undefined
            };
          }
          return inventoryItem;
        })
        .map((inventoryItem) => {
          if (inventoryItem.stickers || inventoryItem.stickerswear) {
            stickerNullToZero = true;
            return {
              ...inventoryItem,
              stickers: inventoryItem.stickers?.map((sticker) =>
                sticker === null ? CS_NO_STICKER : sticker
              ),
              stickerswear: inventoryItem.stickerswear?.map((stickerwear) =>
                stickerwear === null ? CS_NO_STICKER_WEAR : stickerwear
              )
            };
          }
          return inventoryItem;
        });
      if (
        parsed.length !== filtered.length ||
        removedC4Stickers ||
        stickerNullToZero
      ) {
        count += 1;
        await prisma.user.update({
          data: { inventory: JSON.stringify(filtered) },
          where: { id }
        });
      }
    }
  }
  console.log(`[completed] user-inventory-clean-up (updated ${count} users).`);
}

if (basename(process.argv[1]) === "user-inventory-clean-up.ts") {
  main();
}
