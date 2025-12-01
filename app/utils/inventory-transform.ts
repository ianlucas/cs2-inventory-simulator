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

const INVENTORY_ITEM_TYPE_ORDER = {
  [CS2ItemType.Weapon]: 0,
  [CS2ItemType.Melee]: 1,
  [CS2ItemType.Gloves]: 2,
  [CS2ItemType.Agent]: 3,
  [CS2ItemType.Patch]: 4,
  [CS2ItemType.Collectible]: 5,
  [CS2ItemType.MusicKit]: 6,
  [CS2ItemType.Graffiti]: 7,
  [CS2ItemType.Sticker]: 8,
  [CS2ItemType.Keychain]: 9,
  [CS2ItemType.Container]: 10,
  [CS2ItemType.Key]: 11,
  [CS2ItemType.Tool]: 12,
  [CS2ItemType.Utility]: 13,
  [CS2ItemType.Stub]: 14
} as const;

export function transform(
  item: CS2InventoryItem,
  nonEquippable = {
    models: [] as string[],
    types: [] as string[]
  }
) {
  const isEquippable =
    (item.model === undefined || !nonEquippable.models.includes(item.model)) &&
    !nonEquippable.types.includes(item.type);

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
  return (b.item.updatedAt ?? 0) - (a.item.updatedAt ?? 0);
}

export function sortByQuality(
  a: TransformedInventoryItem,
  b: TransformedInventoryItem
) {
  return (
    CS2_RARITY_ORDER.indexOf(CS2RarityColorName[b.item.rarity]) -
    CS2_RARITY_ORDER.indexOf(CS2RarityColorName[a.item.rarity])
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
