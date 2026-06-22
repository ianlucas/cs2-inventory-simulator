/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, CS2Inventory, clamp } from "@ianlucas/cs2-lib";
import {
  getUserInventory,
  getUserInventoryVersion,
  updateUserInventory
} from "~/models/user.server";
import { baseStickerSlabId } from "~/utils/economy";
import { hasKeys } from "~/utils/misc";

const VERSION = 3;
const pending = new Map<string, Promise<unknown>>();

async function applyMigration(userId: string, rawInventory: string) {
  const inventory = CS2Inventory.parse(rawInventory);
  if (inventory === undefined) {
    return;
  }
  for (const [uid, inventoryItem] of Object.entries(inventory.items)) {
    const item = CS2Economy.get(inventoryItem.id);

    // Strip attributes the item type cannot hold. These bricked the whole
    // inventory on load because CS2InventoryItem validates on construction
    // (e.g. a knife/glove carrying stickers, a non-agent carrying patches).
    if (inventoryItem.stickers !== undefined && !item.hasStickers()) {
      inventoryItem.stickers = undefined;
    }
    if (inventoryItem.keychains !== undefined && !item.hasKeychains()) {
      inventoryItem.keychains = undefined;
    }
    if (inventoryItem.patches !== undefined && !item.hasPatches()) {
      inventoryItem.patches = undefined;
    }

    // Clamp wear into the item's valid range, or drop it if the item cannot
    // hold wear at all (e.g. gloves stored below their wearMin).
    if (
      inventoryItem.wear !== undefined &&
      !CS2Economy.safeValidateWear(inventoryItem.wear, item)
    ) {
      inventoryItem.wear = item.hasWear()
        ? clamp(
            inventoryItem.wear,
            item.getMinimumWear(),
            item.getMaximumWear()
          )
        : undefined;
      // Re-check: drop anything still invalid (e.g. excess precision).
      if (
        inventoryItem.wear !== undefined &&
        !CS2Economy.safeValidateWear(inventoryItem.wear, item)
      ) {
        inventoryItem.wear = undefined;
      }
    }

    if (inventoryItem.keychains !== undefined) {
      for (const [slot] of Object.entries(inventoryItem.keychains).filter(
        ([, { id }]) => id === baseStickerSlabId
      )) {
        delete inventoryItem.keychains[slot];
      }
    }

    // Free items need to have some paid econ attached to them. Run this last so
    // an item left empty by the healing above is dropped.
    if (
      item.free &&
      (inventoryItem.stickers === undefined ||
        !hasKeys(inventoryItem.stickers)) &&
      (inventoryItem.keychains === undefined ||
        !hasKeys(inventoryItem.keychains)) &&
      inventoryItem.nameTag === undefined
    ) {
      delete inventory.items[Number(uid)];
    }
  }
  await updateUserInventory(userId, JSON.stringify(inventory), VERSION);
}

export async function migrateInventory(userId?: string) {
  if (userId === undefined) {
    return;
  }
  const version = await getUserInventoryVersion(userId);
  if (version === null || version >= VERSION) {
    return;
  }
  const rawInventory = await getUserInventory(userId);
  if (rawInventory === null) {
    return;
  }
  if (!pending.has(userId)) {
    pending.set(userId, applyMigration(userId, rawInventory));
  }
  await pending.get(userId);
  pending.delete(userId);
}
