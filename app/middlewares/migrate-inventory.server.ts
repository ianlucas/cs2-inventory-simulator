/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, CS2Inventory } from "@ianlucas/cs2-lib";
import {
  getUserInventory,
  getUserInventoryVersion,
  updateUserInventory
} from "~/models/user.server";
import { baseStickerSlab } from "~/utils/economy";
import { hasKeys } from "~/utils/misc";

const VERSION = 1;
const pending = new Map<string, Promise<unknown>>();

async function applyMigration(userId: string, rawInventory: string) {
  const inventory = CS2Inventory.parse(rawInventory);
  if (inventory === undefined) {
    return;
  }
  for (const [uid] of Object.entries(inventory.items).filter(
    ([, inventoryItem]) => {
      const item = CS2Economy.get(inventoryItem.id);
      // Free items need to have some paid econ attached to them.
      if (
        item.free &&
        (inventoryItem.stickers === undefined ||
          !hasKeys(inventoryItem.stickers)) &&
        (inventoryItem.keychains === undefined ||
          !hasKeys(inventoryItem.keychains)) &&
        inventoryItem.nameTag === undefined
      ) {
        return true;
      }
      if (inventoryItem.keychains !== undefined) {
        for (const [slot] of Object.entries(inventoryItem.keychains).filter(
          ([, { id }]) => id === baseStickerSlab
        )) {
          delete inventoryItem.keychains[slot];
        }
      }
      return false;
    }
  )) {
    delete inventory.items[Number(uid)];
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
