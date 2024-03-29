/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export const INVENTORY_PRIMARY_FILTERS = [
  "Everything",
  "Equipment",
  "GraphicArt",
  "Containers",
  "Display"
] as const;

export const INVENTORY_SECONDARY_FILTERS = {
  Everything: undefined,
  Equipment: [
    "AllEquipment",
    "Melee",
    "Pistols",
    "MidTier",
    "Rifles",
    "Misc",
    "Agents",
    "Gloves",
    "MusicKits"
  ],
  GraphicArt: ["AllGraphicArt", "Patches", "Stickers", "Graffiti"],
  Containers: [
    "All",
    "WeaponCases",
    "StickerCapsules",
    "GraffitiBoxes",
    "SouvenirCases",
    "Tools"
  ],
  Display: ["All", "Medals", "MusicKits"]
} as const;
