/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_CategoryMenuItem, CS_filterItems, CS_Item } from "@ianlucas/cslib";
import { useItemTranslation } from "~/hooks/use-item-translation";

export const baseUrl =
  "https://cdn.statically.io/gh/ianlucas/cslib/main/dist/images";

export const instaSelectCategory = [
  "sticker",
  "agent",
  "pin",
  "patch",
  "musickit",
  "case"
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
  "case": ""
} as const;

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
