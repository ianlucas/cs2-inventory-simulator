/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_CategoryMenuItem, CS_Economy, CS_filterItems, CS_Item, CS_ITEMS } from "@ianlucas/cslib";

export const baseUrl =
  "https://cdn.statically.io/gh/ianlucas/cslib/main/dist/images";

export const instaSelectCategory = [
  "sticker",
  "agent",
  "pin",
  "patch",
  "musickit",
  "case",
  "key"
];

export const modelFromType = {
  "agent": "Agent",
  "glove": "Glove",
  "melee": "Knife",
  "musickit": "Music Kit",
  "patch": "Patch",
  "pin": "Pin",
  "sticker": "Sticker",
  "weapon": "Weapon",
  "case": "",
  "key": "Key"
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
  CS_Economy.initialize(CS_ITEMS.map(item => ({
    ...item,
    name: itemTranslation[item.id] || item.name
  })));
}

export function getCSItemName(csItem: CS_Item) {
  if (csItem.free) {
    return {
      model: ["musickit"].includes(csItem.type)
        ? modelFromType[csItem.type]
        : "",
      name: csItem.name
    };
  }
  if (["weapon", "melee", "glove"].includes(csItem.type)) {
    const [weaponName, ...paintName] = csItem.name.split("|");
    return {
      model: (csItem.type === "melee" ? "★ " : "") + weaponName.trim(),
      name: paintName.join("|")
    };
  }
  return {
    model: modelFromType[csItem.type],
    name: csItem.name
  };
}

export function getBaseItems({ category }: CS_CategoryMenuItem) {
  const isDisplayAll = instaSelectCategory.includes(category);
  return CS_filterItems({
    category: category !== "sticker" ? category : undefined,
    type: category === "sticker" ? "sticker" : undefined,
    base: isDisplayAll ? undefined : true
  }).filter(({ free }) =>
    !["glove", "melee", "musickit"].includes(category) || !free
    || (isDisplayAll && (category !== "musickit" || !free))
  );
}

export function getPaidItems(
  { category }: CS_CategoryMenuItem,
  model: string
) {
  return CS_filterItems({
    model
  }).filter(({ base }) => category === "melee" || !base);
}
