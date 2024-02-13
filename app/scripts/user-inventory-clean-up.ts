/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS_Economy,
  CS_InventoryItem,
  CS_NO_STICKER,
  CS_NO_STICKER_WEAR
} from "@ianlucas/cslib";
import { prisma } from "~/db.server";
import { len } from "~/utils/number";

export async function runUserInventoryCleanUp() {
  const users = await prisma.user.findMany({
    select: {
      id: true
    }
  });
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
      let missingUid = false;
      const parsed = JSON.parse(inventory) as CS_InventoryItem[];
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
          const isnull = <T>(value: T) => value === null;
          if (
            len(inventoryItem.stickers?.filter(isnull)) > 0 ||
            len(inventoryItem.stickerswear?.filter(isnull)) > 0
          ) {
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
        })
        .map((inventoryItem, index) => {
          if (inventoryItem.uid === undefined) {
            missingUid = true;

            return {
              ...inventoryItem,
              uid: index
            };
          }
          return inventoryItem;
        });
      if (
        parsed.length !== filtered.length ||
        removedC4Stickers ||
        stickerNullToZero ||
        missingUid
      ) {
        await prisma.user.update({
          data: { inventory: JSON.stringify(filtered) },
          where: { id }
        });
      }
    }
  }
}
