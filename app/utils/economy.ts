/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS_Economy,
  CS_Item,
  CS_ItemTranslations,
  CS_MAX_SEED,
  CS_STICKER_WEAR_FACTOR,
  CS_WEAR_FACTOR
} from "@ianlucas/cs2-lib";
import { CraftItemFilter } from "./craft-filters";

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

export function translateItems(itemTranslation: CS_ItemTranslations[number]) {
  CS_Economy.applyTranslation(itemTranslation);
}

export function getBaseItems({
  category,
  hasModel,
  type,
  isFree
}: CraftItemFilter) {
  return CS_Economy.filterItems({
    category,
    type,
    base: hasModel ? true : undefined
  }).filter(
    ({ free }) => (hasModel && isFree ? free : !free) || (!hasModel && !free)
  );
}

export function getPaidItems({ type }: CraftItemFilter, model: string) {
  return CS_Economy.filterItems({
    model
  }).filter(({ base }) => type === "melee" || !base);
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
