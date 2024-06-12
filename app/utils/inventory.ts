/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2Economy,
  CS2EconomyItem,
  CS2Inventory,
  CS2InventoryItem,
  CS2ItemType,
  CS2ItemTypeValues
} from "@ianlucas/cs2-lib";
import { serverInventoryShape } from "./shapes";

export const UNLOCKABLE_ITEM_TYPE: CS2ItemTypeValues[] = [
  CS2ItemType.Container,
  CS2ItemType.Key
];

export const EDITABLE_ITEM_TYPE: CS2ItemTypeValues[] = [
  CS2ItemType.Weapon,
  CS2ItemType.Melee,
  CS2ItemType.Gloves,
  CS2ItemType.MusicKit
];

export const INSPECTABLE_ITEM_TYPE: CS2ItemTypeValues[] = [
  CS2ItemType.Collectible,
  CS2ItemType.Gloves,
  CS2ItemType.Graffiti,
  CS2ItemType.Melee,
  CS2ItemType.MusicKit,
  CS2ItemType.Patch,
  CS2ItemType.Sticker,
  CS2ItemType.Weapon
];

export function parseInventory(inventory?: string | null) {
  try {
    return serverInventoryShape.parse(CS2Inventory.parse(inventory));
  } catch {
    return undefined;
  }
}

const fakeInventory = new CS2Inventory({});
export function createFakeInventoryItem(
  props: CS2EconomyItem,
  item?: Partial<CS2InventoryItem>
) {
  const inventoryItem = new CS2InventoryItem(
    fakeInventory,
    -1,
    { id: props.id },
    props
  );
  Object.assign(inventoryItem, item);
  return inventoryItem;
}

export function getFreeItemsToDisplay(hideFreeItems = false) {
  if (hideFreeItems) {
    return [];
  }
  return CS2Economy.filterItems({
    free: true
  }).map((item, index) => ({
    equipped: [],
    item: createFakeInventoryItem(item, {
      uid: -1 * (index + 1)
    }),
    uid: -1 * (index + 1)
  }));
}
