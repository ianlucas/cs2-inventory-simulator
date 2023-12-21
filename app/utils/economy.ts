/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS_Economy,
  CS_filterItems,
  CS_Item,
  CS_ITEMS,
  CS_MAX_SEED,
  CS_resolveCaseSpecialItemImage,
  CS_resolveItemImage,
  CS_STICKER_WEAR_FACTOR,
  CS_WEAR_FACTOR
} from "@ianlucas/cslib";
import { ItemFiltersItem } from "./economy-item-filters";

export const baseUrl =
  "https://cdn.statically.io/gh/ianlucas/cslib/main/dist/images";

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

let currentLanguage = "";
export function translateItems(
  language: string,
  itemTranslation: Record<string, string | undefined>
) {
  if (currentLanguage === language) {
    return;
  }
  currentLanguage = language;
  CS_Economy.initialize(
    CS_ITEMS.map((item) => ({
      ...item,
      name: itemTranslation[item.id] || item.name
    }))
  );
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

export function getBaseItems({ category, expand, type }: ItemFiltersItem) {
  return CS_filterItems({
    category,
    type,
    base: expand ? true : undefined
  }).filter(
    ({ free }) =>
      (expand && type === undefined ? free : !free) ||
      (!expand && (type !== "musickit" || !free))
  );
}

export function getPaidItems({ type }: ItemFiltersItem, model: string) {
  return CS_filterItems({
    model
  }).filter(({ base }) => type === "melee" || !base);
}

export function showQuantity(item: CS_Item) {
  return ["case", "key", "sticker", "tool"].includes(item.type);
}

export function resolveItemImage(item: number | CS_Item, wear?: number) {
  return CS_resolveItemImage(baseUrl, item, wear);
}

export function resolveCaseSpecialItemImage(item: number | CS_Item) {
  return CS_resolveCaseSpecialItemImage(baseUrl, item);
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
