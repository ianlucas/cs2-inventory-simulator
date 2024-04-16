/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS_InventoryItem,
  CS_RARITY_COLORS,
  CS_RARITY_ORDER
} from "@ianlucas/cs2-lib";

const INVENTORY_ITEM_TYPE_ORDER = {
  weapon: 0,
  melee: 1,
  glove: 2,
  agent: 3,
  patch: 4,
  collectible: 5,
  musickit: 6,
  graffiti: 7,
  sticker: 8,
  case: 9,
  key: 10,
  tool: 11
} as const;

export function transform(
  item: CS_InventoryItem,
  nonEquippable = {
    models: [] as string[],
    types: [] as string[]
  }
) {
  const isEquippable =
    (item.data.model === undefined ||
      !nonEquippable.models.includes(item.data.model)) &&
    !nonEquippable.types.includes(item.data.type);

  if (!isEquippable) {
    item.equipped = undefined;
    item.equippedCT = undefined;
    item.equippedT = undefined;
  }

  return {
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

export function sortByType(
  a: TransformedInventoryItem,
  b: TransformedInventoryItem
) {
  return (
    INVENTORY_ITEM_TYPE_ORDER[a.item.data.type] -
    INVENTORY_ITEM_TYPE_ORDER[b.item.data.type]
  );
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
