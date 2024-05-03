/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS_Economy,
  CS_Item,
  CS_ItemTranslations,
  CS_MAX_SEED,
  CS_RARITY_ANCIENT_COLOR,
  CS_RARITY_COMMON_COLOR,
  CS_RARITY_IMMORTAL_COLOR,
  CS_RARITY_LEGENDARY_COLOR,
  CS_RARITY_MYTHICAL_COLOR,
  CS_RARITY_RARE_COLOR,
  CS_RARITY_UNCOMMON_COLOR,
  CS_STICKER_WEAR_FACTOR,
  CS_WEAR_FACTOR
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
  [CS_RARITY_COMMON_COLOR]: "Common",
  [CS_RARITY_UNCOMMON_COLOR]: "Uncommon",
  [CS_RARITY_RARE_COLOR]: "Rare",
  [CS_RARITY_MYTHICAL_COLOR]: "Mythical",
  [CS_RARITY_LEGENDARY_COLOR]: "Legendary",
  [CS_RARITY_ANCIENT_COLOR]: "Ancient",
  [CS_RARITY_IMMORTAL_COLOR]: "Immortal"
};

export function translateItems(itemTranslation: CS_ItemTranslations[number]) {
  CS_Economy.applyTranslation(itemTranslation);
}

export function isItemCountable(item: CS_Item) {
  return COUNTABLE_ITEM_TYPES.includes(item.type);
}

export function resolveItemImage(item: number | CS_Item, wear?: number) {
  return CS_Economy.resolveItemImage(assetBaseUrl, item, wear);
}

export function resolveCaseSpecialsImage(item: number | CS_Item) {
  return CS_Economy.resolveCaseSpecialsImage(assetBaseUrl, item);
}

export function resolveCollectionImage(item: number | CS_Item) {
  return CS_Economy.resolveCollectionImage(assetBaseUrl, item);
}

export const seedStringMaxLen = String(CS_MAX_SEED).length;
export const wearStringMaxLen = String(CS_WEAR_FACTOR).length;
export const stickerWearStringMaxLen = String(CS_STICKER_WEAR_FACTOR).length;

export function wearToString(wear: number) {
  return wear.toFixed(wearStringMaxLen - 2);
}

export function stickerWearToString(wear: number) {
  return wear.toFixed(stickerWearStringMaxLen - 2);
}

export function createFakeItem(
  baseItem: CS_Item,
  attributes: Partial<CS_Item>
) {
  return {
    ...baseItem,
    ...attributes
  } satisfies CS_Item;
}

export function sortByName(
  a: CS_Item,
  b: CS_Item
) {
  return a.name.localeCompare(b.name);
}

export function getRarityItemName(item: CS_Item) {
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
    case "glove":
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
    case "case":
      return "Container";
    case "key":
      return "Key";
  }
}
