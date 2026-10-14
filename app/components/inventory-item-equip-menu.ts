/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Team } from "@ianlucas/cs2-lib";
import type { EquipOption } from "~/shared/inventory-equipped";
import type { LoadoutTeam } from "~/shared/loadout";
import type { SystemTranslationTokens } from "~/translation.server";

interface EquipMenuEntry {
  label: SystemTranslationTokens;
  onClick: () => void;
}

type EquipTarget = "inventory" | "loadout" | "replace";

const EQUIP_LABELS = {
  inventory: {
    any: "InventoryItemEquip",
    both: "InventoryItemEquipBothTeams",
    ct: "InventoryItemEquipCT",
    t: "InventoryItemEquipT"
  },
  loadout: {
    any: "InventoryItemEquipInLoadout",
    both: "InventoryItemEquipBothTeamsInLoadout",
    ct: "InventoryItemEquipCTInLoadout",
    t: "InventoryItemEquipTInLoadout"
  },
  replace: {
    any: "InventoryItemReplaceInLoadout",
    both: "InventoryItemReplaceBothTeamsInLoadout",
    ct: "InventoryItemReplaceCTInLoadout",
    t: "InventoryItemReplaceTInLoadout"
  }
} as const;

const UNEQUIP_LABELS = {
  any: "InventoryItemUnequip",
  ct: "InventoryItemUnequipCT",
  t: "InventoryItemUnequipT"
} as const;

function getTeamKey(team?: LoadoutTeam) {
  return team === undefined ? "any" : team === CS2Team.T ? "t" : "ct";
}

function getTarget(options: EquipOption[]): EquipTarget {
  return options.every(({ slot }) => slot === undefined)
    ? "inventory"
    : options.some(({ replaces }) => replaces)
      ? "replace"
      : "loadout";
}

// Items the active loadout holds are changed from the loadout page, so they
// get a link there instead of the unequip entries.
export function getEquipMenu(
  options: EquipOption[],
  {
    equip,
    unequip,
    viewInLoadout
  }: {
    equip: (team?: LoadoutTeam) => void;
    unequip: (team?: LoadoutTeam) => void;
    viewInLoadout: (team?: LoadoutTeam) => void;
  }
): [EquipMenuEntry[], EquipMenuEntry[]] {
  const unequipped = options.filter(({ isEquipped }) => !isEquipped);
  const equipped = options.filter(({ isEquipped }) => isEquipped);
  const inLoadout = equipped.filter(({ slot }) => slot !== undefined);

  const equipMenu: EquipMenuEntry[] = unequipped.map((option) => ({
    label: EQUIP_LABELS[getTarget([option])][getTeamKey(option.team)],
    onClick: () => equip(option.team)
  }));
  // Both teams only when the two go to the same place.
  if (
    unequipped.length === 2 &&
    new Set(unequipped.map(({ slot }) => slot === undefined)).size === 1
  ) {
    equipMenu.push({
      label: EQUIP_LABELS[getTarget(unequipped)].both,
      onClick: () => {
        for (const { team } of unequipped) {
          equip(team);
        }
      }
    });
  }

  const unequipMenu: EquipMenuEntry[] = equipped
    .filter(({ slot }) => slot === undefined)
    .map(({ team }) => ({
      label: UNEQUIP_LABELS[getTeamKey(team)],
      onClick: () => unequip(team)
    }));
  if (inLoadout.length > 0) {
    const team = inLoadout.some(({ team }) => team === CS2Team.CT)
      ? CS2Team.CT
      : inLoadout[0].team;
    unequipMenu.push({
      label: "InventoryItemViewInLoadout",
      onClick: () => viewInLoadout(team)
    });
  }

  return [equipMenu, unequipMenu];
}
