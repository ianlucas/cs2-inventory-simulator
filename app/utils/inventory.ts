/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS_Economy,
  CS_InventoryItem,
  CS_Item,
  CS_NONE
} from "@ianlucas/cs2-lib";
import { serverInventoryShape } from "./shapes";

export const UNLOCKABLE_ITEM_TYPE = ["case", "key"];
export const EDITABLE_ITEM_TYPE = ["weapon", "melee", "glove", "musickit"];
export const INSPECTABLE_ITEM_TYPE = [
  "case",
  "collectible",
  "glove",
  "graffiti",
  "melee",
  "musickit",
  "patch",
  "sticker",
  "weapon"
];

export function parseInventory(inventory?: string | null) {
  try {
    if (!inventory) {
      return [];
    }
    return serverInventoryShape.parse(JSON.parse(inventory));
  } catch {
    return [];
  }
}

export function createFakeInventoryItem(
  data: CS_Item,
  item?: Partial<CS_InventoryItem>
) {
  return {
    data,
    id: data.id,
    uid: -1,
    ...item
  } satisfies CS_InventoryItem;
}

export function getFreeItemsToDisplay(hideFreeItems = false) {
  if (hideFreeItems) {
    return [];
  }
  return CS_Economy.filterItems({
    free: true
  }).map((item, index) => ({
    equipped: [],
    item: createFakeInventoryItem(item, {
      uid: -1 * (index + 1)
    }),
    uid: -1 * (index + 1)
  }));
}

export function getStickerCount(stickers?: number[]) {
  if (stickers === undefined) {
    return 0;
  }
  return stickers.filter((sticker) => sticker !== CS_NONE).length;
}

export function resolveInventoryItem(item: CS_Item | CS_InventoryItem) {
  return (item as CS_InventoryItem).uid !== undefined
    ? (item as CS_InventoryItem)
    : undefined;
}

export function resolveCSItem(item: CS_Item | CS_InventoryItem) {
  return (item as CS_InventoryItem).uid !== undefined
    ? (item as CS_InventoryItem).data
    : (item as CS_Item);
}
