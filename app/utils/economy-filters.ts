/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, CS2ItemType } from "@ianlucas/cs2-lib";

export const ECONOMY_ITEM_FILTERS = [
  {
    category: "secondary",
    hasModel: true,
    icon: "pistol",
    isFree: true,
    label: "Pistol",
    type: CS2ItemType.Weapon
  },
  {
    category: "smg",
    hasModel: true,
    icon: "smg",
    isFree: true,
    label: "SMG",
    type: CS2ItemType.Weapon
  },
  {
    category: "heavy",
    hasModel: true,
    isFree: true,
    icon: "heavy",
    label: "Heavy",
    type: CS2ItemType.Weapon
  },
  {
    category: "rifle",
    hasModel: true,
    isFree: true,
    icon: "rifle",
    label: "Rifle",
    type: CS2ItemType.Weapon
  },
  {
    category: "equipment",
    hasModel: true,
    icon: "equipment",
    isFree: true,
    label: "Equipment",
    type: CS2ItemType.Weapon
  },
  {
    hasModel: true,
    icon: "knife",
    label: "Knife",
    type: CS2ItemType.Melee
  },

  {
    hasModel: true,
    icon: "glove",
    label: "Glove",
    type: CS2ItemType.Gloves
  },
  {
    hasModel: false,
    icon: "sticker",
    label: "Sticker",
    type: CS2ItemType.Sticker
  },
  {
    hasModel: false,
    icon: "agent",
    label: "Agent",
    type: CS2ItemType.Agent
  },
  {
    hasModel: false,
    icon: "patch",
    label: "Patch",
    type: CS2ItemType.Patch
  },
  {
    hasModel: false,
    icon: "musickit",
    label: "Music Kit",
    type: CS2ItemType.MusicKit
  },
  {
    hasModel: false,
    icon: "spray",
    label: "Graffiti",
    type: CS2ItemType.Graffiti
  },
  {
    hasModel: false,
    icon: "collectible",
    label: "Collectible",
    type: CS2ItemType.Collectible
  },
  {
    hasModel: false,
    icon: "case",
    label: "Case",
    type: CS2ItemType.Container
  },
  {
    hasModel: false,
    icon: "key",
    label: "Key",
    type: CS2ItemType.ContainerKey
  },
  {
    hasModel: false,
    icon: "tool",
    label: "Tool",
    type: CS2ItemType.Tool
  }
];

export type EconomyItemFilter = (typeof ECONOMY_ITEM_FILTERS)[number];

export function getBaseItems({
  category,
  hasModel,
  type,
  isFree
}: EconomyItemFilter) {
  return CS2Economy.filterItems({
    category,
    type,
    base: hasModel ? true : undefined
  }).filter(
    ({ free }) => (hasModel && isFree ? free : !free) || (!hasModel && !free)
  );
}

export function getPaidItems({ type }: EconomyItemFilter, model: string) {
  return CS2Economy.filterItems({
    model
  }).filter(({ base }) => type === CS2ItemType.Melee || !base);
}
