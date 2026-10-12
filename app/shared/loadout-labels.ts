/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { SystemTranslationTokens } from "~/translation.server";
import { LoadoutGroup } from "./loadout";

export const LOADOUT_GROUP_LABELS: Record<
  "all" | LoadoutGroup,
  SystemTranslationTokens
> = {
  all: "LoadoutGroupAll",
  secondary0: "LoadoutGroupStartingPistol",
  secondary: "LoadoutGroupOtherPistols",
  smg: "LoadoutGroupMidTier",
  rifle: "LoadoutGroupRifles",
  customplayer: "LoadoutGroupAgents",
  clothing_hands: "LoadoutGroupGloves",
  melee: "LoadoutGroupMelee",
  equipment2: "LoadoutGroupZeus",
  c4: "LoadoutGroupC4",
  musickit: "LoadoutGroupMusicKit",
  flair0: "LoadoutGroupDisplay",
  spray0: "LoadoutGroupGraffiti"
};

export const LOADOUT_WEAPON_GROUP_ALL_LABELS: Partial<
  Record<LoadoutGroup, SystemTranslationTokens>
> = {
  secondary0: "LoadoutAllStartingPistols",
  secondary: "LoadoutAllOtherPistols",
  smg: "LoadoutAllMidTier",
  rifle: "LoadoutAllRifles"
};
