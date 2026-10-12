/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2Economy,
  CS2EconomyItem,
  CS2ItemType,
  CS2Team
} from "@ianlucas/cs2-lib";

// Mirrors items_game.txt's flexible_loadout_* keys until cs2-lib exposes them.

export type LoadoutTeam = typeof CS2Team.CT | typeof CS2Team.T;

export const LOADOUT_STARTING_PISTOLS = ["glock", "hkp2000", "usp_silencer"];

export const LOADOUT_DEFAULT_WEAPONS: Record<
  LoadoutTeam,
  Record<"secondary" | "smg" | "rifle", string[]>
> = {
  [CS2Team.CT]: {
    secondary: ["hkp2000", "elite", "p250", "fiveseven", "deagle"],
    smg: ["nova", "xm1014", "mp5sd", "p90", "mp9"],
    rifle: ["famas", "m4a1_silencer", "ssg08", "aug", "awp"]
  },
  [CS2Team.T]: {
    secondary: ["glock", "elite", "p250", "tec9", "deagle"],
    smg: ["nova", "xm1014", "mp5sd", "p90", "mac10"],
    rifle: ["galilar", "ak47", "ssg08", "sg556", "awp"]
  }
};

export const LOADOUT_EQUIPMENT: Record<LoadoutTeam, string[]> = {
  [CS2Team.CT]: ["kevlar", "assaultsuit", "taser", "defuser"],
  [CS2Team.T]: ["kevlar", "assaultsuit", "taser"]
};

export const LOADOUT_GRENADES: Record<LoadoutTeam, string[]> = {
  [CS2Team.CT]: [
    "flashbang",
    "smokegrenade",
    "hegrenade",
    "incgrenade",
    "decoy"
  ],
  [CS2Team.T]: ["flashbang", "smokegrenade", "hegrenade", "molotov", "decoy"]
};

export function getDefaultWeapon(modelKey: string) {
  return CS2Economy.findItem({
    isDefault: true,
    modelKey,
    type: CS2ItemType.Weapon
  });
}

export function getDefaultMelee(team: LoadoutTeam) {
  return CS2Economy.findItem({
    isDefault: true,
    type: CS2ItemType.Melee,
    usableByTeam: team
  });
}

export function getDefaultGloves(team: LoadoutTeam) {
  return CS2Economy.findItem({
    isDefault: true,
    type: CS2ItemType.Gloves,
    usableByTeam: team
  });
}

// TODO: Use the map-based default agents once cs2-lib ships them.
export function getDefaultAgent(team: LoadoutTeam): CS2EconomyItem {
  return CS2Economy.findItem({ type: CS2ItemType.Agent, usableByTeam: team });
}

export const LOADOUT_USAGE_MODEL_KEYS = [
  "ak47",
  "assaultsuit",
  "aug",
  "awp",
  "bizon",
  "cz75a",
  "deagle",
  "decoy",
  "defuser",
  "elite",
  "famas",
  "fiveseven",
  "flashbang",
  "g3sg1",
  "galilar",
  "glock",
  "hegrenade",
  "hkp2000",
  "incgrenade",
  "kevlar",
  "m249",
  "m4a1",
  "m4a1_silencer",
  "mac10",
  "mag7",
  "molotov",
  "mp5sd",
  "mp7",
  "mp9",
  "negev",
  "nova",
  "p250",
  "p90",
  "revolver",
  "sawedoff",
  "scar20",
  "sg556",
  "smokegrenade",
  "ssg08",
  "taser",
  "tec9",
  "ump45",
  "usp_silencer",
  "xm1014"
];

export function getLoadoutUsageToken(modelKey: string) {
  return `LoadoutUsage${modelKey.replace(/(?:^|_)(\w)/g, (_, char: string) => char.toUpperCase())}`;
}
