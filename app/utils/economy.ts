/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS_Economy,
  CS_Item,
  CS_ITEMS,
  CS_ItemTranslations,
  CS_MAX_SEED,
  CS_STICKER_WEAR_FACTOR,
  CS_WEAR_FACTOR
} from "@ianlucas/cslib";
import { CraftItemFilter } from "./craft-filters";

export const baseUrl =
  "https://cdn.statically.io/gh/ianlucas/cslib/main/assets/images";

export const modelFromType = {
  agent: "Agent",
  case: "",
  glove: "Glove",
  graffiti: "Graffiti",
  key: "",
  melee: "Knife",
  musickit: "Music Kit",
  patch: "Patch",
  pin: "",
  sticker: "Sticker",
  tool: "",
  weapon: "Weapon"
} as const;

export function translateItems(itemTranslation: CS_ItemTranslations[number]) {
  CS_Economy.use(CS_ITEMS);
  CS_Economy.applyTranslation(itemTranslation);
}

export function getCSItemName(item: CS_Item) {
  if (item.free) {
    return {
      model: ["musickit"].includes(item.type) ? modelFromType[item.type] : "",
      name: item.name
    };
  }
  if (["weapon", "melee", "glove"].includes(item.type)) {
    const [weaponName, ...paintName] = item.name.split("|");
    return {
      model: (item.type === "melee" ? "★ " : "") + weaponName.trim(),
      name: paintName.join("|")
    };
  }
  return {
    model: modelFromType[item.type],
    name: item.name
  };
}

export function getBaseItems({ category, hasModel, type }: CraftItemFilter) {
  return CS_Economy.filterItems({
    category,
    type,
    base: hasModel ? true : undefined
  }).filter(
    ({ free }) =>
      (hasModel && type === undefined ? free : !free) ||
      (!hasModel && (type !== "musickit" || !free))
  );
}

export function getPaidItems({ type }: CraftItemFilter, model: string) {
  return CS_Economy.filterItems({
    model
  }).filter(({ base }) => type === "melee" || !base);
}

export function showQuantity(item: CS_Item) {
  return ["case", "key", "sticker", "tool"].includes(item.type);
}

export function resolveItemImage(item: number | CS_Item, wear?: number) {
  return CS_Economy.resolveItemImage(baseUrl, item, wear);
}

export function resolveCaseSpecialItemImage(item: number | CS_Item) {
  return CS_Economy.resolveCaseSpecialsImage(baseUrl, item);
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

export function isWeaponCase(item: CS_Item) {
  // We need to check this way because `category` is affected by translation.
  return item.category === CS_Economy.getById(9129).category;
}

export function isStickerCapsule(item: CS_Item) {
  // We need to check this way because `category` is affected by translation.
  return item.category === CS_Economy.getById(9134).category;
}

export function isGraffitiBox(item: CS_Item) {
  // We need to check this way because `category` is affected by translation.
  return item.category === CS_Economy.getById(11234).category;
}

export function isSouvenirCase(item: CS_Item) {
  // We need to check this way because `category` is affected by translation.
  return item.category === CS_Economy.getById(9147).category;
}
