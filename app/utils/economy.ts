/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  countDecimals,
  CS2_ITEMS,
  CS2_MAX_KEYCHAIN_SEED,
  CS2_MAX_SEED,
  CS2_MAX_STICKER_ROTATION,
  CS2_MAX_STICKER_WEAR,
  CS2_MAX_STICKERS,
  CS2_MIN_KEYCHAIN_SEED,
  CS2_MIN_STICKER_ROTATION,
  CS2_MIN_STICKER_WEAR,
  CS2_STICKER_OFFSET_FACTOR,
  CS2_STICKER_WEAR_FACTOR,
  CS2_WEAR_FACTOR,
  CS2Economy,
  CS2EconomyItem,
  CS2ItemTranslationByLanguage,
  CS2ItemType,
  CS2RarityColor,
  fail,
  isFactorPrecise
} from "@ianlucas/cs2-lib";
import {
  CS2_PREVIEW_URL,
  isCommandInspect,
  isSteamInspectLink
} from "@ianlucas/cs2-lib-inspect";

export const COUNTABLE_ITEM_TYPES: CS2ItemType[] = [
  CS2ItemType.Container,
  CS2ItemType.Graffiti,
  CS2ItemType.Key,
  CS2ItemType.Patch,
  CS2ItemType.Sticker,
  CS2ItemType.Tool
];

export const RarityLabel = {
  [CS2RarityColor.Default]: "Default",
  [CS2RarityColor.Common]: "Common",
  [CS2RarityColor.Uncommon]: "Uncommon",
  [CS2RarityColor.Rare]: "Rare",
  [CS2RarityColor.Mythical]: "Mythical",
  [CS2RarityColor.Legendary]: "Legendary",
  [CS2RarityColor.Ancient]: "Ancient",
  [CS2RarityColor.Immortal]: "Immortal"
} as const;

export function updateEconomyLanguage(
  language: CS2ItemTranslationByLanguage[string]
) {
  CS2Economy.load({
    items: CS2_ITEMS,
    language
  });
}

export function isItemCountable(item: CS2EconomyItem) {
  return COUNTABLE_ITEM_TYPES.includes(item.type);
}

export const baseStickerSlabId = 15200;
export const newItemStartingId = 26817;
export const newItemEndAt = 1784841228427;
// Keychain offsets keep the app's own flat range: the lib publishes no keychain
// offset bounds (its validator still only checks finiteness), so the app owns it.
export const minKeychainOffset = -100;
export const maxKeychainOffset = 100;
export const keychainOffsetFactor = 0.001;
export const seedStringMaxLen = String(CS2_MAX_SEED).length;
export const wearStringMaxLen = String(CS2_WEAR_FACTOR).length;
export const stickerWearStringMaxLen = String(CS2_STICKER_WEAR_FACTOR).length;
// Sticker offsets follow the lib's per-model envelope (bounds come from the
// economy item); only the precision grid is fixed here. Every published bound is
// sub-unit, so the input width is sign + "0." + the grid's decimals.
const stickerOffsetDecimalPlaces = countDecimals(CS2_STICKER_OFFSET_FACTOR);
export const stickerOffsetStringMaxLen =
  "-0.".length + stickerOffsetDecimalPlaces;
const keychainOffsetDecimalPlaces = countDecimals(keychainOffsetFactor);
export const keychainOffsetStringMaxLen =
  String(maxKeychainOffset).length + 1 + keychainOffsetDecimalPlaces;
// v8 uses a signed [-180, 180] range; the longest input is the negative bound
// ("-180" = 4 chars), so size the max length off the minimum.
export const stickerRotationStringMaxLen = String(
  CS2_MIN_STICKER_ROTATION
).length;

export function wearToString(wear: number) {
  return wear.toFixed(wearStringMaxLen - 2);
}

export function stickerWearToString(wear: number) {
  return wear.toFixed(stickerWearStringMaxLen - 2);
}

export function validateStickerWear(wear: number) {
  return (
    isFactorPrecise(wear, CS2_STICKER_WEAR_FACTOR) &&
    wear >= CS2_MIN_STICKER_WEAR &&
    wear <= CS2_MAX_STICKER_WEAR
  );
}

export function stickerOffsetToString(offset: number) {
  return offset.toFixed(stickerOffsetDecimalPlaces);
}

// Bounds are the model's published envelope (`getMinimum/MaximumStickerOffset*`),
// passed in by the editor; `CS2Inventory` is the authoritative gate downstream.
export function validateStickerOffset(
  offset: number,
  min: number | undefined,
  max: number | undefined
) {
  return (
    isFactorPrecise(offset, CS2_STICKER_OFFSET_FACTOR) &&
    (min === undefined || offset >= min) &&
    (max === undefined || offset <= max)
  );
}

export function keychainOffsetToString(offset: number) {
  return offset.toFixed(keychainOffsetDecimalPlaces);
}

export function validateKeychainOffset(offset: number) {
  return (
    isFactorPrecise(offset, keychainOffsetFactor) &&
    offset >= minKeychainOffset &&
    offset <= maxKeychainOffset
  );
}

export function validateStickerRotation(rotation: number) {
  return (
    String(rotation).length <= stickerRotationStringMaxLen &&
    rotation >= CS2_MIN_STICKER_ROTATION &&
    rotation <= CS2_MAX_STICKER_ROTATION
  );
}

export const stickerSchemaStringMaxLen = String(CS2_MAX_STICKERS - 1).length;

export function validateStickerSchema(schema: number, item?: CS2EconomyItem) {
  return (
    Number.isInteger(schema) &&
    schema >= 0 &&
    schema <= (item?.getStickerSchemaCount() ?? CS2_MAX_STICKERS) - 1
  );
}

export const keychainSeedStringMaxLen = String(CS2_MAX_KEYCHAIN_SEED).length;

export function validateKeychainSeed(seed: number) {
  return (
    Number.isInteger(seed) &&
    seed >= CS2_MIN_KEYCHAIN_SEED &&
    seed <= CS2_MAX_KEYCHAIN_SEED
  );
}

export function createFakeItem(
  { economy, item, language }: CS2EconomyItem,
  attributes: Partial<CS2EconomyItem>
) {
  const fakeItem = new CS2EconomyItem(economy, item, language);
  Object.assign(fakeItem, attributes);
  return fakeItem;
}

export function sortByName(a: CS2EconomyItem, b: CS2EconomyItem) {
  return a.name.localeCompare(b.name);
}

export function getRarityItemName(item: CS2EconomyItem) {
  switch (true) {
    case item.isC4():
      return "C4";
    case item.isPistol():
      return "Pistol";
    case item.isSniperRifle():
      return "SniperRifle";
    case item.isRifle():
      return "Rifle";
    case item.isSMG():
      return "SMG";
    case item.isMachinegun():
      return "Machinegun";
    case item.isHeavy():
      return "Shotgun";
    case item.isEquipment():
      return "Equipment";
    case item.isContract():
      return "Contract";
    case item.isTool():
      return "Tool";
  }
  switch (item.type) {
    case CS2ItemType.Melee:
      return "Knife";
    case CS2ItemType.Gloves:
      return "Gloves";
    case CS2ItemType.Sticker:
      return "Sticker";
    case CS2ItemType.Agent:
      return "Agent";
    case CS2ItemType.Keychain:
      return "Charm";
    case CS2ItemType.Patch:
      return "Patch";
    case CS2ItemType.MusicKit:
      return "MusicKit";
    case CS2ItemType.Graffiti:
      return "Graffiti";
    case CS2ItemType.Collectible:
      return "Collectible";
    case CS2ItemType.Container:
      return "Container";
    case CS2ItemType.Key:
      return "Key";
  }
  fail();
}

export function unlockNonSpecialItem(container: CS2EconomyItem) {
  let attempt = 0;
  while (true) {
    const unlockedItem = container.unlockContainer();
    if (!unlockedItem.special || attempt > 255) {
      return unlockedItem;
    }
    attempt += 1;
  }
}

export function isNewItem(item: CS2EconomyItem) {
  return item.id >= newItemStartingId && newItemEndAt > Date.now();
}

export function normalizeInspectLink(link: string) {
  const parts = link.split("csgo_econ_action_preview");
  if (parts.length !== 2) {
    return link;
  }
  return (CS2_PREVIEW_URL.replace("%20", "") + parts[1]).replace(" ", "%20");
}

export function isValidInspectLink(link: string) {
  return (
    isCommandInspect(link) ||
    isSteamInspectLink(link) ||
    link.startsWith(CS2_PREVIEW_URL)
  );
}
