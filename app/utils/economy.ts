/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  countDecimals,
  CS2_ITEMS,
  CS2_KEYCHAIN_POSITION_FACTOR,
  CS2_MAX_KEYCHAIN_SEED,
  CS2_MAX_SEED,
  CS2_MAX_STICKERS,
  CS2_MIN_KEYCHAIN_SEED,
  CS2_MIN_STICKER_ROTATION,
  CS2_STICKER_OFFSET_FACTOR,
  CS2_STICKER_WEAR_FACTOR,
  CS2_WEAR_FACTOR,
  CS2Economy,
  CS2EconomyItem,
  CS2ItemTranslationByLanguage,
  CS2ItemType,
  CS2RarityColor,
  fail
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

export function createItemHideFilter({
  hideCategory,
  hideType,
  hideModel,
  hideId
}: {
  hideCategory: string[];
  hideType: string[];
  hideModel: string[];
  hideId: number[];
}) {
  return function filter({
    id,
    type,
    modelKey,
    loadoutCategory
  }: CS2EconomyItem) {
    if (
      loadoutCategory !== undefined &&
      hideCategory.includes(loadoutCategory)
    ) {
      return false;
    }
    if (hideType.includes(type)) {
      return false;
    }
    if (modelKey !== undefined && hideModel.includes(modelKey)) {
      return false;
    }
    if (hideId.includes(id)) {
      return false;
    }
    return true;
  };
}

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

export const newItemStartingId = 26817;
export const newItemEndAt = 1784841228427;
export const seedStringMaxLen = String(CS2_MAX_SEED).length;
export const wearStringMaxLen = String(CS2_WEAR_FACTOR).length;
export const stickerWearStringMaxLen = String(CS2_STICKER_WEAR_FACTOR).length;
const stickerOffsetDecimalPlaces = countDecimals(CS2_STICKER_OFFSET_FACTOR);
export const stickerOffsetStringMaxLen =
  "-0.".length + stickerOffsetDecimalPlaces;
const keychainPositionDecimalPlaces = countDecimals(CS2_KEYCHAIN_POSITION_FACTOR);
export const stickerRotationStringMaxLen =
  String(CS2_MIN_STICKER_ROTATION).length + ".5".length;

export function wearToString(wear: number) {
  return wear.toFixed(wearStringMaxLen - 2);
}

export function stickerWearToString(wear: number) {
  return wear.toFixed(stickerWearStringMaxLen - 2);
}

export function stickerOffsetToString(offset: number) {
  return offset.toFixed(stickerOffsetDecimalPlaces);
}

export function keychainPositionToString(offset: number) {
  return offset.toFixed(keychainPositionDecimalPlaces);
}

export function keychainPositionStringMaxLen(min: number, max: number) {
  return Math.max(
    keychainPositionToString(min).length,
    keychainPositionToString(max).length
  );
}

export function getDefaultKeychainPosition(
  min: number | undefined,
  max: number | undefined
) {
  if (min !== undefined && min > 0) {
    return min;
  }
  if (max !== undefined && max < 0) {
    return max;
  }
  return 0;
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
