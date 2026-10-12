/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2Economy,
  CS2Inventory,
  CS2InventoryItem,
  CS2ItemType,
  CS2Team,
  CS2_MIN_KEYCHAIN_SEED,
  CS2_MIN_PET_SEED,
  CS2_MIN_SEED,
  CS2_MIN_STICKER_WEAR,
  assert,
  ensure
} from "@ianlucas/cs2-lib";
import hashObject from "hash-object";
import {
  Loadout,
  LoadoutTeam,
  getEconomyItem,
  getGridSlotId,
  getLoadoutEntries
} from "./loadout";

interface EconItem {
  charges?: number;
  def?: number;
  hash?: string;
  musicId?: number;
  nametag?: string;
  paint?: number;
  petId?: number;
  seed?: number;
  stattrak?: number;
  stickers?: {
    def: number;
    rotation?: number;
    slot: number;
    wear?: number;
    x?: number;
    y?: number;
  }[];
  keychains?: {
    def: number;
    seed: number;
    slot: number;
    sticker?: number;
    x?: number;
    y?: number;
    z?: number;
  }[];
  style?: number;
  tint?: number;
  uid?: number;
  upgradeLevel?: number;
  wear?: number;
}

function hash<T>(obj: T & { hash?: string }) {
  obj.hash = hashObject(obj).substring(0, 7);
  return obj;
}

export async function generate(
  inventory: CS2Inventory,
  nonEquippable = {
    models: [] as string[],
    types: [] as string[]
  },
  loadout?: Loadout
) {
  const knives: Record<number, EconItem> = {};
  const gloves: Record<number, EconItem> = {};
  const tWeapons: Record<number, EconItem> = {};
  const ctWeapons: Record<number, EconItem> = {};
  const agents: Record<number, EconItem> = {};
  const teams = [undefined, CS2Team.CT, CS2Team.T];
  let collectible: EconItem | undefined;
  let graffiti: EconItem | undefined;
  let musicKit: EconItem | undefined;
  let pet: EconItem | undefined;
  let loadoutSlots: Record<number, Record<number, number>> | undefined;

  function isEquippable(item: CS2InventoryItem) {
    return (
      (item.modelKey === undefined ||
        !nonEquippable.models.includes(item.modelKey)) &&
      !nonEquippable.types.includes(item.type)
    );
  }

  function equip(item: CS2InventoryItem, team?: LoadoutTeam) {
    switch (item.type) {
      case CS2ItemType.MusicKit:
        assert(item.variantIndex);
        musicKit = {
          musicId: item.variantIndex,
          stattrak: item.statTrak ?? -1,
          uid: item.uid
        };
        break;
      case CS2ItemType.Collectible:
        collectible = { def: item.definitionIndex };
        break;
      case CS2ItemType.Melee:
        assert(team);
        assert(item.definitionIndex);
        knives[team] = hash({
          def: item.definitionIndex,
          nametag: item.nameTag ?? "",
          paint: item.variantIndex ?? 0,
          seed: item.seed ?? CS2_MIN_SEED,
          stattrak: item.statTrak ?? -1,
          stickers: [],
          uid: item.uid,
          wear: item.getWear()
        });
        break;
      case CS2ItemType.Gloves:
        assert(team);
        assert(item.definitionIndex);
        gloves[team] = hash({
          def: item.definitionIndex,
          paint: item.variantIndex ?? 0,
          seed: item.seed ?? CS2_MIN_SEED,
          wear: item.getWear()
        });
        break;
      case CS2ItemType.Weapon: {
        assert(item.definitionIndex);
        const weapon = team === CS2Team.CT ? ctWeapons : tWeapons;
        weapon[item.definitionIndex] = hash({
          def: item.definitionIndex,
          nametag: item.nameTag ?? "",
          paint: item.variantIndex ?? 0,
          seed: item.seed ?? CS2_MIN_SEED,
          stattrak: item.statTrak ?? -1,
          stickers: item.someStickers().map(([index, sticker]) => ({
            def: CS2Economy.getById(sticker.id).variantIndex ?? 0,
            rotation: sticker.rotation,
            schema: sticker.schema,
            slot: index,
            wear: sticker.wear ?? CS2_MIN_STICKER_WEAR,
            x: sticker.x,
            y: sticker.y
          })),
          keychains: item.someKeychains().map(([index, keychain]) => {
            const keychainEcon = CS2Economy.getById(keychain.id);
            return {
              def: keychainEcon.variantIndex ?? 0,
              seed: keychain.seed ?? CS2_MIN_KEYCHAIN_SEED,
              slot: index,
              sticker: keychainEcon.displayedSticker?.variantIndex,
              x: keychain.x,
              y: keychain.y,
              z: keychain.z
            };
          }),
          uid: item.uid,
          wear: item.getWear()
        });
        break;
      }
      case CS2ItemType.Agent:
        assert(team);
        agents[team] = hash({
          def: item.definitionIndex,
          stickers: item.somePatches().map(([index, patch]) => ({
            def: CS2Economy.getById(patch).variantIndex ?? 0,
            slot: index
          }))
        });
        break;
      case CS2ItemType.Pet:
        pet = hash({
          def: item.definitionIndex,
          nametag: item.nameTag ?? "",
          petId: item.variantIndex,
          seed: item.seed ?? CS2_MIN_PET_SEED,
          style: item.style,
          uid: item.uid,
          upgradeLevel: item.getUpgradeLevel()
        });
        break;
      case CS2ItemType.Graffiti:
        assert(item.variantIndex);
        graffiti = {
          charges: item.getCharges(),
          def: item.variantIndex,
          tint: item.tintIndex ?? 0,
          uid: item.uid
        };
        break;
    }
  }

  for (const item of inventory.getAll()) {
    if (!isEquippable(item)) {
      continue;
    }
    for (const team of teams) {
      if (team === undefined && !item.equipped) {
        continue;
      }
      if (team === CS2Team.CT && !item.equippedCT) {
        continue;
      }
      if (team === CS2Team.T && !item.equippedT) {
        continue;
      }
      equip(item, team);
    }
  }

  // The active loadout replaces whatever it covers, and a stock or default
  // item in it is the same as having nothing equipped.
  if (loadout !== undefined) {
    collectible = graffiti = musicKit = undefined;
    loadoutSlots = { [CS2Team.CT]: {}, [CS2Team.T]: {} };
    for (const team of [CS2Team.CT, CS2Team.T]) {
      delete agents[team];
      delete gloves[team];
      delete knives[team];
    }
    for (const { item, slot, team } of getLoadoutEntries(loadout)) {
      const { definitionIndex, type } = getEconomyItem(inventory, item);
      const slotId = getGridSlotId(slot);
      if (slotId !== undefined) {
        loadoutSlots[team][slotId] = ensure(definitionIndex);
      }
      if (type === CS2ItemType.Weapon) {
        delete (team === CS2Team.CT ? ctWeapons : tWeapons)[
          ensure(definitionIndex)
        ];
      }
      if (item.type === "inventory") {
        const inventoryItem = inventory.get(item.uid);
        if (isEquippable(inventoryItem)) {
          equip(inventoryItem, team);
        }
      }
    }
  }

  return {
    agents,
    collectible,
    ctWeapons,
    gloves,
    graffiti,
    knives,
    loadout: loadoutSlots,
    musicKit,
    pet,
    tWeapons
  };
}
