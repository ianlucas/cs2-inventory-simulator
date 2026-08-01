/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2BaseInventoryItem,
  CS2Economy,
  CS2EconomyItem,
  CS2Inventory,
  CS2InventoryItem,
  CS2InventorySpec,
  CS2ItemType
} from "@ianlucas/cs2-lib";
import lzstring from "lz-string";
import type { ItemEditorAttributes } from "~/components/item-editor";
import { safeParseJson } from "./misc";

export const UNLOCKABLE_ITEM_TYPE: CS2ItemType[] = [
  CS2ItemType.Container,
  CS2ItemType.Key
];

export const EDITABLE_ITEM_TYPE: CS2ItemType[] = [
  CS2ItemType.Agent,
  CS2ItemType.Gloves,
  CS2ItemType.Keychain,
  CS2ItemType.Melee,
  CS2ItemType.MusicKit,
  CS2ItemType.Weapon
];

export const INSPECTABLE_ITEM_TYPE: CS2ItemType[] = [
  CS2ItemType.Collectible,
  CS2ItemType.Gloves,
  CS2ItemType.Graffiti,
  CS2ItemType.Keychain,
  CS2ItemType.Melee,
  CS2ItemType.MusicKit,
  CS2ItemType.Patch,
  CS2ItemType.Sticker,
  CS2ItemType.Weapon
];

export function safeLoadInventory(
  rawInventory: string | null,
  options?: Partial<CS2InventorySpec>
) {
  if (rawInventory === null) {
    return undefined;
  }
  try {
    return CS2Inventory.load(rawInventory, {
      dropEmptyDefaultItems: true,
      ...options
    });
  } catch {
    return undefined;
  }
}

export function loadOrCreateInventory(
  rawInventory: string | null,
  options?: Partial<CS2InventorySpec>
) {
  return safeLoadInventory(rawInventory, options) ?? new CS2Inventory(options);
}

export function hasInventoryContent(
  rawInventory: string | null
): rawInventory is string {
  if (rawInventory === null || rawInventory.trim().length === 0) {
    return false;
  }
  const data = safeParseJson(rawInventory);
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return true;
  }
  const { items } = data as { items?: unknown };
  if (typeof items !== "object" || items === null) {
    return false;
  }
  return Object.keys(items).length > 0;
}

const fakeInventory = new CS2Inventory();
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

export function createFakeInventoryItemFromBase(item: CS2BaseInventoryItem) {
  return new CS2InventoryItem(
    fakeInventory,
    -1,
    item,
    CS2Economy.getById(item.id)
  );
}

export function getFreeItemsToDisplay(hideFreeItems = false) {
  if (hideFreeItems) {
    return [];
  }
  return CS2Economy.filterItems({
    isDefault: true
  })
    .filter(
      (item) =>
        item.type !== CS2ItemType.Utility && item.type !== CS2ItemType.Keychain
    )
    .map((item, index) => ({
      equipped: [],
      item: createFakeInventoryItem(item, {
        uid: -1 * (index + 1)
      }),
      uid: -1 * (index + 1)
    }));
}

export const CHARM_DETACHMENTS_DISPLAY_UID = -9999;

export function getCharmDetachmentsToDisplay(inventory: CS2Inventory) {
  if (inventory.getAll().some((item) => item.isCharmDetachment())) {
    return [];
  }
  return [
    {
      equipped: [],
      item: createFakeInventoryItem(CS2Economy.getCharmDetachment(), {
        uid: CHARM_DETACHMENTS_DISPLAY_UID
      }),
      uid: CHARM_DETACHMENTS_DISPLAY_UID
    }
  ];
}

export function getInventoryItemShareUrl(
  item: CS2InventoryItem,
  userId?: string
) {
  return `${window.location.origin}/craft?share=${lzstring.compressToEncodedURIComponent(
    JSON.stringify({ u: userId, i: item.asBase() })
  )}`;
}

export function editInventoryItem(
  inventory: CS2Inventory,
  uid: number,
  { statTrak, ...attributes }: Omit<ItemEditorAttributes, "quantity">
) {
  return inventory.edit(uid, {
    statTrak: statTrak ? (inventory.get(uid).statTrak ?? 0) : undefined,
    nameTag: attributes.nameTag,
    stickers: attributes.stickers,
    patches: attributes.patches,
    keychains: attributes.keychains,
    seed: attributes.seed,
    wear: attributes.wear
  });
}
