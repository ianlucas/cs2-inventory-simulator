/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, CS2ItemType, CS2Team } from "@ianlucas/cs2-lib";

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

// weapons.vdata's m_nPrice.
export const LOADOUT_PRICES: Record<string, number> = {
  ak47: 2700,
  aug: 3300,
  awp: 4750,
  bizon: 1300,
  cz75a: 500,
  deagle: 700,
  elite: 300,
  famas: 1950,
  fiveseven: 500,
  g3sg1: 5000,
  galilar: 1800,
  glock: 200,
  hkp2000: 200,
  m249: 5200,
  m4a1: 2900,
  m4a1_silencer: 2900,
  mac10: 1050,
  mag7: 1300,
  mp5sd: 1400,
  mp7: 1400,
  mp9: 1250,
  negev: 1700,
  nova: 1050,
  p250: 300,
  p90: 2350,
  revolver: 600,
  sawedoff: 1100,
  scar20: 5000,
  sg556: 3000,
  ssg08: 1700,
  tec9: 500,
  ump45: 1200,
  usp_silencer: 200,
  xm1014: 2000
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

export function getDefaultAgent(team: LoadoutTeam) {
  return CS2Economy.findItem({
    isDefault: true,
    type: CS2ItemType.Agent,
    usableByTeam: team
  });
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
