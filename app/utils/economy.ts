/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2Economy,
  CS2EconomyItem,
  CS2ItemLocalizationByLanguage,
  CS2ItemType,
  CS2ItemTypeValues,
  CS2RarityColor,
  CS2_ITEMS,
  CS2_MAX_SEED,
  CS2_MAX_STICKER_ROTATION,
  CS2_MAX_STICKER_WEAR,
  CS2_MIN_STICKER_ROTATION,
  CS2_MIN_STICKER_WEAR,
  CS2_STICKER_WEAR_FACTOR,
  CS2_WEAR_FACTOR,
  fail
} from "@ianlucas/cs2-lib";
import { clientGlobals, isServerContext } from "~/globals";

export const defaultAssetsBaseUrl =
  "https://cdn.statically.io/gh/ianlucas/cs2-lib/6599e8f55d262882b79fbcfad7c795e67aa13538/assets/images";

export const COUNTABLE_ITEM_TYPES: CS2ItemTypeValues[] = [
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

export function getAssetsBaseUrl() {
  return (
    (isServerContext
      ? process.env.ASSETS_BASE_URL
      : clientGlobals.assetsBaseUrl) ?? defaultAssetsBaseUrl
  );
}

export function updateEconomyLanguage(
  language: CS2ItemLocalizationByLanguage[string]
) {
  CS2Economy.use({
    items: CS2_ITEMS,
    language
  });
}

export function isItemCountable(item: CS2EconomyItem) {
  return COUNTABLE_ITEM_TYPES.includes(item.type);
}

export function resolveItemImage(item: number | CS2EconomyItem, wear?: number) {
  return CS2Economy.resolveItemImage(getAssetsBaseUrl(), item, wear);
}

export function resolveCaseSpecialsImage(item: number | CS2EconomyItem) {
  return CS2Economy.resolveContainerSpecialsImage(getAssetsBaseUrl(), item);
}

export function resolveCollectionImage(item: number | CS2EconomyItem) {
  return CS2Economy.resolveCollectionImage(getAssetsBaseUrl(), item);
}

export const minStickerOffset = -2;
export const maxStickerOffset = 2;
export const stickerOffsetFactor = 0.001;
export const seedStringMaxLen = String(CS2_MAX_SEED).length;
export const wearStringMaxLen = String(CS2_WEAR_FACTOR).length;
export const stickerWearStringMaxLen = String(CS2_STICKER_WEAR_FACTOR).length;
export const stickerOffsetStringMaxLen = String(stickerOffsetFactor).length;
export const stickerRotationStringMaxLen = String(
  CS2_MAX_STICKER_ROTATION
).length;

export function wearToString(wear: number) {
  return wear.toFixed(wearStringMaxLen - 2);
}

export function stickerWearToString(wear: number) {
  return wear.toFixed(stickerWearStringMaxLen - 2);
}

export function validateStickerWear(wear: number) {
  return (
    String(wear).length <= stickerWearStringMaxLen &&
    wear >= CS2_MIN_STICKER_WEAR &&
    wear <= CS2_MAX_STICKER_WEAR
  );
}

export function stickerOffsetToString(offset: number) {
  return offset.toFixed(stickerOffsetStringMaxLen - 2);
}

export function validateStickerOffset(offset: number) {
  return (
    String(offset).length <= stickerOffsetStringMaxLen + (offset > 0 ? 0 : 1) &&
    offset >= minStickerOffset &&
    offset <= maxStickerOffset
  );
}

export function validateStickerRotation(rotation: number) {
  return (
    String(rotation).length <= stickerRotationStringMaxLen &&
    rotation >= CS2_MIN_STICKER_ROTATION &&
    rotation <= CS2_MAX_STICKER_ROTATION
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
