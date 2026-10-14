/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2InventoryItem,
  CS2ItemType,
  CS2RarityColorName,
  CS2_RARITY_ORDER
} from "@ianlucas/cs2-lib";
import { EquippedFlags, isEquippedForAny } from "./inventory-equipped";

const INVENTORY_ITEM_TYPE_ORDER = {
  [CS2ItemType.Weapon]: 0,
  [CS2ItemType.Melee]: 1,
  [CS2ItemType.Gloves]: 2,
  [CS2ItemType.Agent]: 3,
  [CS2ItemType.Pet]: 4,
  [CS2ItemType.Patch]: 5,
  [CS2ItemType.Collectible]: 6,
  [CS2ItemType.MusicKit]: 7,
  [CS2ItemType.Graffiti]: 8,
  [CS2ItemType.Sticker]: 9,
  [CS2ItemType.Keychain]: 10,
  [CS2ItemType.Container]: 11,
  [CS2ItemType.Key]: 12,
  [CS2ItemType.Tool]: 13,
  [CS2ItemType.Utility]: 14,
  [CS2ItemType.Stub]: 15
} as const;

export function getEquippedColors({
  equipped,
  equippedCT,
  equippedT
}: EquippedFlags) {
  return [
    equipped && "text-white",
    equippedCT && "text-sky-300",
    equippedT && "text-yellow-400"
  ];
}

export function transform(
  item: CS2InventoryItem,
  equipped: EquippedFlags = {}
) {
  return { equipped, item, uid: item.uid };
}

export type TransformedInventoryItem = ReturnType<typeof transform>;
export type TransformedInventoryItems = TransformedInventoryItem[];

export function sortByName(
  a: TransformedInventoryItem,
  b: TransformedInventoryItem
) {
  return a.item.name.localeCompare(b.item.name);
}

export function sortByType(
  a: TransformedInventoryItem,
  b: TransformedInventoryItem
) {
  return (
    INVENTORY_ITEM_TYPE_ORDER[a.item.type] -
    INVENTORY_ITEM_TYPE_ORDER[b.item.type]
  );
}

export function sortByEquipped(
  a: TransformedInventoryItem,
  b: TransformedInventoryItem
) {
  const equippedA = isEquippedForAny(a.equipped);
  const equippedB = isEquippedForAny(b.equipped);
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
  return (b.item.updatedAt ?? 0) - (a.item.updatedAt ?? 0);
}

export function sortByQuality(
  a: TransformedInventoryItem,
  b: TransformedInventoryItem
) {
  return (
    CS2_RARITY_ORDER.indexOf(CS2RarityColorName[b.item.rarityColor]) -
    CS2_RARITY_ORDER.indexOf(CS2RarityColorName[a.item.rarityColor])
  );
}

export function sortByCollection(
  a: TransformedInventoryItem,
  b: TransformedInventoryItem
) {
  return (b.item.collectionName ?? "").localeCompare(
    a.item.collectionName ?? ""
  );
}

export function sortItemsByEquipped(
  inventory: TransformedInventoryItems,
  free: TransformedInventoryItems
) {
  return [
    ...inventory.sort(sortByName).sort(sortByType).sort(sortByEquipped),
    ...free.sort(sortByName).sort(sortByType).sort(sortByEquipped)
  ];
}

export function sortItems(
  sorter: string,
  inventory: TransformedInventoryItems,
  free: TransformedInventoryItems
) {
  switch (sorter) {
    case "equipped":
      return sortItemsByEquipped(inventory, free);
    case "newest":
      return [
        ...inventory.sort(sortByNewest),
        ...free.sort(sortByName).sort(sortByType).sort(sortByEquipped)
      ];
    case "quality":
      return [...inventory, ...free]
        .sort(sortByName)
        .sort(sortByType)
        .sort(sortByQuality);
    case "alphabetical":
      return [...inventory, ...free].sort(sortByName);
    case "type":
      return [...inventory, ...free].sort(sortByType);
    case "collection":
      return [...inventory.sort(sortByType).sort(sortByCollection), ...free];
  }
  return [];
}
