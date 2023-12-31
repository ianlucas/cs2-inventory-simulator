/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export const ITEM_FILTERS = [
  {
    label: "Pistol",
    icon: "pistol",
    category: "secondary",
    expand: true
  },
  {
    label: "SMG",
    icon: "smg",
    category: "smg",
    expand: true
  },
  {
    label: "Heavy",
    icon: "heavy",
    category: "heavy",
    expand: true
  },
  {
    label: "Rifle",
    icon: "rifle",
    category: "rifle",
    expand: true
  },
  {
    label: "Knife",
    icon: "knife",
    type: "melee" as const,
    expand: true
  },
  {
    label: "Glove",
    icon: "glove",
    type: "glove" as const,
    expand: true
  },
  {
    label: "Sticker",
    icon: "sticker",
    type: "sticker" as const,
    expand: false
  },
  {
    label: "Agent",
    icon: "agent",
    type: "agent" as const,
    expand: false
  },
  {
    label: "Patch",
    icon: "patch",
    type: "patch" as const,
    expand: false
  },
  {
    label: "Music Kit",
    icon: "musickit",
    type: "musickit" as const,
    expand: false
  },
  {
    label: "Graffiti",
    icon: "spray",
    type: "graffiti" as const,
    expand: false
  },
  {
    label: "Pin",
    icon: "pin",
    type: "pin" as const,
    expand: false
  },
  {
    label: "Case",
    icon: "case",
    type: "case" as const,
    expand: false
  },
  {
    label: "Key",
    icon: "key",
    type: "key" as const,
    expand: false
  },
  {
    label: "Tool",
    icon: "tool",
    type: "tool" as const,
    expand: false
  }
];

export type ItemFiltersItem = (typeof ITEM_FILTERS)[number];
