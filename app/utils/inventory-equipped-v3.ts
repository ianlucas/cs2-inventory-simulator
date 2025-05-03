/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2Economy,
  CS2Inventory,
  CS2ItemType,
  CS2Team,
  CS2_MIN_SEED,
  CS2_MIN_STICKER_WEAR,
  assert
} from "@ianlucas/cs2-lib";

interface BaseEconItem {
  def: number;
  paint: number;
  seed: number;
  wear: number;
}

interface WeaponEconItem extends BaseEconItem {
  legacy: boolean;
  nametag: string;
  stattrak: number;
  stickers: {
    def: number;
    rotation?: number;
    slot: number;
    wear: number;
    x?: number;
    y?: number;
  }[];
  uid: number;
}

interface AgentItem {
  def?: number;
  model: string;
  patches: number[];
  vofallback: boolean;
  vofemale: boolean;
  voprefix: string;
}

interface MusicKitItem {
  def: number;
  stattrak: number;
  uid: number;
}

interface GraffitiItem {
  def: number;
  tint: number;
}

export async function generate(
  inventory: CS2Inventory,
  nonEquippable = {
    models: [] as string[],
    types: [] as string[]
  }
) {
  const knives: Record<number, WeaponEconItem> = {};
  const gloves: Record<number, BaseEconItem> = {};
  const tWeapons: Record<number, WeaponEconItem> = {};
  const ctWeapons: Record<number, WeaponEconItem> = {};
  const agents: Record<number, AgentItem> = {};
  const teams = [undefined, CS2Team.CT, CS2Team.T];
  let collectible: number | undefined;
  let graffiti: GraffitiItem | undefined;
  let musicKit: MusicKitItem | undefined;

  for (const item of inventory.getAll()) {
    const data = item;

    const isEquippable =
      (data.model === undefined ||
        !nonEquippable.models.includes(data.model)) &&
      !nonEquippable.types.includes(data.type);

    if (!isEquippable) {
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
      switch (data.type) {
        case CS2ItemType.MusicKit:
          assert(data.index);
          musicKit = {
            def: data.index,
            stattrak: item.statTrak ?? -1,
            uid: item.uid
          };
          break;
        case CS2ItemType.Collectible:
          collectible = data.def;
          break;
        case CS2ItemType.Melee:
          assert(team);
          assert(data.def);
          knives[team] = {
            def: data.def,
            legacy: false,
            nametag: item.nameTag ?? "",
            paint: data.index ?? 0,
            seed: item.seed ?? CS2_MIN_SEED,
            stattrak: item.statTrak ?? -1,
            stickers: [],
            uid: item.uid,
            wear: item.getWear()
          };
          break;
        case CS2ItemType.Gloves:
          assert(team);
          assert(data.def);
          gloves[team] = {
            def: data.def,
            paint: data.index ?? 0,
            seed: item.seed ?? CS2_MIN_SEED,
            wear: item.getWear()
          };
          break;
        case CS2ItemType.Weapon:
          assert(data.def);
          const weapon = team === CS2Team.CT ? ctWeapons : tWeapons;
          weapon[data.def] = {
            def: data.def,
            legacy: data.legacy ?? false,
            nametag: item.nameTag ?? "",
            paint: data.index ?? 0,
            seed: item.seed ?? CS2_MIN_SEED,
            stattrak: item.statTrak ?? -1,
            stickers: item.someStickers().map(([index, sticker]) => ({
              def: CS2Economy.getById(sticker.id).index ?? 0,
              rotation: sticker.rotation,
              slot: index,
              wear: sticker.wear ?? CS2_MIN_STICKER_WEAR,
              x: sticker.x,
              y: sticker.y
            })),
            uid: item.uid,
            wear: item.getWear()
          };
          break;
        case CS2ItemType.Agent:
          assert(team);
          assert(data.model);
          assert(data.voPrefix);
          agents[team] = {
            def: data.def,
            model: data.model,
            patches: data
              .allPatches()
              .map(([_, patch]) =>
                patch !== undefined ? (CS2Economy.getById(patch).index ?? 0) : 0
              ),
            vofallback: data.voFallback ?? false,
            vofemale: data.voFemale ?? false,
            voprefix: data.voPrefix
          };
          break;
        case CS2ItemType.Graffiti:
          assert(data.index);
          graffiti = {
            def: data.index,
            tint: data.tint ?? 0
          };
          break;
      }
    }
  }

  return {
    agents,
    ctWeapons,
    gloves,
    graffiti,
    knives,
    musicKit,
    pin: collectible,
    tWeapons
  };
}
