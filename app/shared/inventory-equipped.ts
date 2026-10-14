/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2_INVENTORY_EQUIPPABLE_ITEMS,
  CS2EconomyItem,
  CS2Inventory,
  CS2InventoryItem,
  CS2Team
} from "@ianlucas/cs2-lib";
import {
  Loadout,
  LoadoutSlot,
  LoadoutTeam,
  findItemSlot,
  getLoadoutEntries,
  getLoadoutItem,
  isSharedSlot
} from "./loadout";

export interface NonEquippable {
  models: string[];
  types: string[];
}

export type EquippedFlags = Partial<
  Pick<CS2InventoryItem, "equipped" | "equippedCT" | "equippedT">
>;

export interface EquipOption {
  isEquipped: boolean;
  /** The slot holds an item from the inventory, which equipping replaces. */
  replaces: boolean;
  /** The active loadout's slot, when the loadout decides what goes there. */
  slot?: LoadoutSlot;
  team?: LoadoutTeam;
}

const TEAMS = [undefined, CS2Team.CT, CS2Team.T] as const;

function getFlagKey(team?: LoadoutTeam) {
  return team === undefined
    ? "equipped"
    : team === CS2Team.CT
      ? "equippedCT"
      : "equippedT";
}

export function isEquippedFor(flags: EquippedFlags, team?: LoadoutTeam) {
  return flags[getFlagKey(team)] === true;
}

export function isEquippedForAny(flags: EquippedFlags) {
  return TEAMS.some((team) => isEquippedFor(flags, team));
}

export function isEquippable(
  item: CS2EconomyItem,
  { models, types }: NonEquippable
) {
  return (
    (item.modelKey === undefined || !models.includes(item.modelKey)) &&
    !types.includes(item.type)
  );
}

// The active loadout replaces what the inventory has equipped in every slot it
// fills, and a stock or default item in it is the same as having nothing
// equipped.
export function getEquippedFlags(
  inventory: CS2Inventory,
  loadout?: Loadout,
  nonEquippable: NonEquippable = { models: [], types: [] }
) {
  const flags = new Map<number, EquippedFlags>();

  function equip(item: CS2InventoryItem, team?: LoadoutTeam) {
    if (isEquippable(item, nonEquippable)) {
      flags.set(item.uid, {
        ...flags.get(item.uid),
        [getFlagKey(team)]: true
      });
    }
  }

  for (const item of inventory.getAll()) {
    for (const team of TEAMS) {
      if (
        isEquippedFor(item, team) &&
        (loadout === undefined ||
          findItemSlot(loadout, inventory, team, item) === undefined)
      ) {
        equip(item, team);
      }
    }
  }
  if (loadout !== undefined) {
    for (const { item, slot, team } of getLoadoutEntries(loadout)) {
      if (item.type === "inventory") {
        equip(inventory.get(item.uid), isSharedSlot(slot) ? undefined : team);
      }
    }
  }
  return flags;
}

function getEquipTeams(item: CS2EconomyItem): (LoadoutTeam | undefined)[] {
  const { teams } = item;
  if (teams !== undefined) {
    return [CS2Team.T, CS2Team.CT].filter((team) => teams.includes(team));
  }
  return CS2_INVENTORY_EQUIPPABLE_ITEMS.includes(item.type) ? [undefined] : [];
}

export function createEquippedInventory(
  inventory: CS2Inventory,
  loadout?: Loadout,
  nonEquippable?: NonEquippable
) {
  const flags = getEquippedFlags(inventory, loadout, nonEquippable);

  function getFlags(uid: number): EquippedFlags {
    return flags.get(uid) ?? {};
  }

  function getEquipOption(
    item: CS2InventoryItem,
    team?: LoadoutTeam
  ): EquipOption {
    const slot =
      loadout !== undefined
        ? findItemSlot(loadout, inventory, team, item)
        : undefined;
    return {
      isEquipped: isEquippedFor(getFlags(item.uid), team),
      replaces:
        loadout !== undefined &&
        slot !== undefined &&
        // Shared slots are the same for either team.
        getLoadoutItem(loadout, team ?? CS2Team.CT, slot)?.type === "inventory",
      slot,
      team
    };
  }

  return {
    getEquipOption,
    getEquipOptions(item: CS2InventoryItem) {
      return getEquipTeams(item).map((team) => getEquipOption(item, team));
    },
    getFlags
  };
}

export type EquippedInventory = ReturnType<typeof createEquippedInventory>;
