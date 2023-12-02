/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export const ITEM_FILTERS = [
  {
    label: "Pistol",
    category: "secondary",
    expand: true
  },
  {
    label: "SMG",
    category: "smg",
    expand: true
  },
  {
    label: "Heavy",
    category: "heavy",
    expand: true
  },
  {
    label: "Rifle",
    category: "rifle",
    expand: true
  },
  {
    label: "Knife",
    type: "melee" as const,
    expand: true
  },
  {
    label: "Glove",
    type: "glove" as const,
    expand: true
  },
  {
    label: "Sticker",
    type: "sticker" as const,
    expand: false
  },
  {
    label: "Agent",
    type: "agent" as const,
    expand: false
  },
  {
    label: "Patch",
    type: "patch" as const,
    expand: false
  },
  {
    label: "Music Kit",
    type: "musickit" as const,
    expand: false
  },
  {
    label: "Graffiti",
    type: "graffiti" as const,
    expand: false
  },
  {
    label: "Pin",
    type: "pin" as const,
    expand: false
  },
  {
    label: "Case",
    type: "case" as const,
    expand: false
  },
  {
    label: "Key",
    type: "key" as const,
    expand: false
  },
  {
    label: "Tool",
    type: "tool" as const,
    expand: false
  }
];

export type ItemFiltersItem = typeof ITEM_FILTERS[number];
