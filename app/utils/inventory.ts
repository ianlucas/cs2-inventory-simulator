/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Economy, CS_filterItems, CS_InventoryItem } from "@ianlucas/cslib";
import { getCSItemName } from "./economy";
import { internalInventoryShape } from "./shapes";

/** @TODO It's a union of wearable, nametaggable, seedable, and stickerable arrays. */
export const EDITABLE_INVENTORY_TYPE = ["weapon", "melee", "glove", "musickit"];

export function parseInventory(inventory?: string | null) {
  if (!inventory) {
    return [];
  }
  try {
    return internalInventoryShape.parse(JSON.parse(inventory));
  } catch {
    return [];
  }
}

export function transform(inventoryItem: CS_InventoryItem) {
  const item = CS_Economy.getById(inventoryItem.id);
  return {
    equipped: [
      inventoryItem.equipped && "text-white",
      inventoryItem.equippedCT && "text-sky-300",
      inventoryItem.equippedT && "text-yellow-400"
    ],
    uid: inventoryItem.uid,
    inventoryItem,
    item,
    ...getCSItemName(item)
  };
}

type TransformedInventoryItem = ReturnType<typeof transform>;

export function sortByName(
  a: TransformedInventoryItem,
  b: TransformedInventoryItem
) {
  return a.item.name.localeCompare(b.item.name);
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
  return typeOrder[a.item.type] - typeOrder[b.item.type];
}

export function sortByEquipped(
  a: TransformedInventoryItem,
  b: TransformedInventoryItem
) {
  const equippedA =
    a.inventoryItem.equipped ||
    a.inventoryItem.equippedCT ||
    a.inventoryItem.equippedT;
  const equippedB =
    b.inventoryItem.equipped ||
    b.inventoryItem.equippedCT ||
    b.inventoryItem.equippedT;
  if (equippedA && !equippedB) {
    return -1;
  } else if (!equippedA && equippedB) {
    return 1;
  } else {
    return 0;
  }
}

export function getFreeItemsToDisplay(onlyC4 = false) {
  return CS_filterItems({
    free: true
  })
    .map((item, index) => ({
      equipped: [],
      uid: -1 * (index + 1),
      inventoryItem: { id: item.id } as CS_InventoryItem,
      item,
      ...getCSItemName(item)
    }))
    .filter(({ item }) => !onlyC4 || item.category === "c4");
}
