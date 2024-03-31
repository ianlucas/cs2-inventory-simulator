/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS_filterItems,
  CS_InventoryItem,
  CS_NONE,
  CS_RARITY_COLORS,
  CS_RARITY_ORDER
} from "@ianlucas/cslib";
import { getCSItemName } from "./economy";
import { serverInventoryShape } from "./shapes";

/** @TODO It's a union of wearable, nametaggable, seedable, and stickerable arrays. */
export const EDITABLE_INVENTORY_TYPE = ["weapon", "melee", "glove", "musickit"];

export function parseInventory(inventory?: string | null) {
  if (!inventory) {
    return [];
  }
  try {
    return serverInventoryShape.parse(JSON.parse(inventory));
  } catch {
    return [];
  }
}

export function transform(item: CS_InventoryItem) {
  return {
    ...getCSItemName(item.data),
    equipped: [
      item.equipped && "text-white",
      item.equippedCT && "text-sky-300",
      item.equippedT && "text-yellow-400"
    ],
    item,
    uid: item.uid
  };
}

export type TransformedInventoryItem = ReturnType<typeof transform>;
export type TransformedInventoryItems = TransformedInventoryItem[];

export function sortByName(
  a: TransformedInventoryItem,
  b: TransformedInventoryItem
) {
  return a.item.data.name.localeCompare(b.item.data.name);
}

const typeOrder = {
  weapon: 0,
  melee: 1,
  glove: 2,
  agent: 3,
  patch: 4,
  pin: 5,
  musickit: 6,
  graffiti: 7,
  sticker: 8,
  case: 9,
  key: 10,
  tool: 11
} as const;

export function sortByType(
  a: TransformedInventoryItem,
  b: TransformedInventoryItem
) {
  return typeOrder[a.item.data.type] - typeOrder[b.item.data.type];
}

export function sortByEquipped(
  a: TransformedInventoryItem,
  b: TransformedInventoryItem
) {
  const equippedA = a.item.equipped || a.item.equippedCT || a.item.equippedT;
  const equippedB = b.item.equipped || b.item.equippedCT || b.item.equippedT;
  if (equippedA && !equippedB) {
    return -1;
  } else if (!equippedA && equippedB) {
    return 1;
  } else {
    return 0;
  }
}

export function sortByNewest(
  a: TransformedInventoryItem,
  b: TransformedInventoryItem
) {
  return (b.item.updatedat ?? 0) - (a.item.updatedat ?? 0);
}

export function sortByQuality(
  a: TransformedInventoryItem,
  b: TransformedInventoryItem
) {
  return (
    CS_RARITY_ORDER.indexOf(CS_RARITY_COLORS[b.item.data.rarity] as any) -
    CS_RARITY_ORDER.indexOf(CS_RARITY_COLORS[a.item.data.rarity] as any)
  );
}

export function sortByCollection(
  a: TransformedInventoryItem,
  b: TransformedInventoryItem
) {
  return (b.item.data.collectionname ?? "").localeCompare(
    a.item.data.collectionname ?? ""
  );
}

export function getFreeItemsToDisplay(hideFreeItems = false) {
  if (hideFreeItems) {
    return [];
  }
  return CS_filterItems({
    free: true
  }).map((item, index) => ({
    ...getCSItemName(item),
    equipped: [],
    item: {
      data: item,
      id: item.id,
      uid: -1 * (index + 1)
    } satisfies CS_InventoryItem,
    uid: -1 * (index + 1)
  }));
}

export function countStickers(stickers?: number[]) {
  if (stickers === undefined) {
    return 0;
  }
  return stickers.filter((sticker) => sticker !== CS_NONE).length;
}
