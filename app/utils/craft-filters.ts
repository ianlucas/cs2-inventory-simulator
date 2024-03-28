/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export const CRAFT_ITEM_FILTERS = [
  {
    label: "Pistol",
    icon: "pistol",
    category: "secondary",
    hasModel: true
  },
  {
    label: "SMG",
    icon: "smg",
    category: "smg",
    hasModel: true
  },
  {
    label: "Heavy",
    icon: "heavy",
    category: "heavy",
    hasModel: true
  },
  {
    label: "Rifle",
    icon: "rifle",
    category: "rifle",
    hasModel: true
  },
  {
    label: "Knife",
    icon: "knife",
    type: "melee" as const,
    hasModel: true
  },
  {
    label: "Equipment",
    icon: "equipment",
    category: "equipment",
    hasModel: true
  },
  {
    label: "Glove",
    icon: "glove",
    type: "glove" as const,
    hasModel: true
  },
  {
    label: "Sticker",
    icon: "sticker",
    type: "sticker" as const,
    hasModel: false
  },
  {
    label: "Agent",
    icon: "agent",
    type: "agent" as const,
    hasModel: false
  },
  {
    label: "Patch",
    icon: "patch",
    type: "patch" as const,
    hasModel: false
  },
  {
    label: "Music Kit",
    icon: "musickit",
    type: "musickit" as const,
    hasModel: false
  },
  {
    label: "Graffiti",
    icon: "spray",
    type: "graffiti" as const,
    hasModel: false
  },
  {
    label: "Pin",
    icon: "pin",
    type: "pin" as const,
    hasModel: false
  },
  {
    label: "Case",
    icon: "case",
    type: "case" as const,
    hasModel: false
  },
  {
    label: "Key",
    icon: "key",
    type: "key" as const,
    hasModel: false
  },
  {
    label: "Tool",
    icon: "tool",
    type: "tool" as const,
    hasModel: false
  }
];

export type CraftItemFilter = (typeof CRAFT_ITEM_FILTERS)[number];
