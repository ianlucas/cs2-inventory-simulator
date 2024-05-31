/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2Economy,
  CS2EconomyItem,
  CS2ItemLocalizationByLanguage,
  CS2RarityColor,
  CS2_ITEMS,
  CS2_MAX_SEED,
  CS2_STICKER_WEAR_FACTOR,
  CS2_WEAR_FACTOR
} from "@ianlucas/cs2-lib";

export const assetBaseUrl =
  "https://cdn.statically.io/gh/ianlucas/cs2-lib/main/assets/images";

export const COUNTABLE_ITEM_TYPES = [
  "case",
  "graffiti",
  "key",
  "patch",
  "sticker",
  "tool"
];
export const FREE_MODEL_IN_NAME_TYPES = ["musickit"];
export const RARITY_LABEL: Record<string, string> = {
  [CS2RarityColor.Common]: "Common",
  [CS2RarityColor.Uncommon]: "Uncommon",
  [CS2RarityColor.Rare]: "Rare",
  [CS2RarityColor.Mythical]: "Mythical",
  [CS2RarityColor.Legendary]: "Legendary",
  [CS2RarityColor.Ancient]: "Ancient",
  [CS2RarityColor.Immortal]: "Immortal"
};

export function updateEconomyTranslation(
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
  return CS2Economy.resolveItemImage(assetBaseUrl, item, wear);
}

export function resolveCaseSpecialsImage(item: number | CS2EconomyItem) {
  return CS2Economy.resolveContainerSpecialsImage(assetBaseUrl, item);
}

export function resolveCollectionImage(item: number | CS2EconomyItem) {
  return CS2Economy.resolveCollectionImage(assetBaseUrl, item);
}

export const seedStringMaxLen = String(CS2_MAX_SEED).length;
export const wearStringMaxLen = String(CS2_WEAR_FACTOR).length;
export const stickerWearStringMaxLen = String(CS2_STICKER_WEAR_FACTOR).length;

export function wearToString(wear: number) {
  return wear.toFixed(wearStringMaxLen - 2);
}

export function stickerWearToString(wear: number) {
  return wear.toFixed(stickerWearStringMaxLen - 2);
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
  const [model] = item.name.split(" | ");
  if (item.type === "weapon") {
    if (item.category == "secondary") {
      return "Pistol";
    }
    if (item.category == "rifle") {
      if (["AWP", "SSG 08", "SCAR 20", "G3SG1"].includes(model)) {
        return "SniperRifle";
      }
      return "Rifle";
    }
    if (item.category === "smg") {
      return "SMG";
    }
    if (item.category === "heavy") {
      if (["Negev", "M249"].includes(model)) {
        return "Machinegun";
      }
      return "Shotgun";
    }
    if (item.category === "equipment") {
      return "Equipment";
    }
  }
  if (item.type === "tool") {
    if (item.id === 12032) {
      return "Contract";
    }
    return "Tool";
  }
  switch (item.type) {
    case "melee":
      return "Knife";
    case "gloves":
      return "Gloves";
    case "sticker":
      return "Sticker";
    case "agent":
      return "Agent";
    case "patch":
      return "Patch";
    case "musickit":
      return "MusicKit";
    case "graffiti":
      return "Graffiti";
    case "collectible":
      return "Collectible";
    case "container":
      return "Container";
    case "containerkey":
      return "Key";
  }
}
