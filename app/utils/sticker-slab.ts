/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2Economy,
  CS2EconomyItem,
  CS2Inventory,
  assert,
  ensure
} from "@ianlucas/cs2-lib";

// Sealed slabs are per-sticker keychain items linked to their sticker via
// `displayedStickerId` and to the Sticker Slab tool via `parentId`. Only the
// ids are cached — economy instances are reloaded per language, so items must
// be resolved through the current CS2Economy.
let slabKeychainIdByStickerId: Map<number, number> | undefined;
let slabToolId: number | undefined;

function buildStickerSlabIndex() {
  if (slabKeychainIdByStickerId === undefined) {
    slabKeychainIdByStickerId = new Map();
    for (const item of CS2Economy.items.values()) {
      if (item.displayedStickerId !== undefined) {
        slabKeychainIdByStickerId.set(item.displayedStickerId, item.id);
        slabToolId ??= item.parentId;
      }
    }
  }
  return slabKeychainIdByStickerId;
}

export function getStickerSlabTool() {
  buildStickerSlabIndex();
  return CS2Economy.getById(ensure(slabToolId));
}

export function getStickerSlabKeychain(stickerId: number) {
  return CS2Economy.getById(ensure(buildStickerSlabIndex().get(stickerId)));
}

export function isStickerSlabTool(item: CS2EconomyItem) {
  buildStickerSlabIndex();
  return item.id === slabToolId;
}

export function isSealedStickerSlab(item: CS2EconomyItem) {
  return item.displayedStickerId !== undefined;
}

export function extractItemSticker(inventory: CS2Inventory, slabUid: number) {
  const slab = inventory.get(slabUid);
  const stickerId = ensure(slab.displayedStickerId);
  return inventory.remove(slabUid).add({ id: stickerId });
}

export function sealItemSticker(
  inventory: CS2Inventory,
  toolUid: number,
  stickerUid: number
) {
  assert(isStickerSlabTool(inventory.get(toolUid)));
  const sticker = inventory.get(stickerUid).expectSticker();
  const slabKeychain = getStickerSlabKeychain(sticker.id);
  return inventory
    .remove(toolUid)
    .remove(stickerUid)
    .add({ id: slabKeychain.id });
}
