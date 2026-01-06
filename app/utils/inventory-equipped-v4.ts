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
import hashObject from "hash-object";

interface EconItem {
  def?: number;
  hash?: string;
  musicId?: number;
  nametag?: string;
  paint?: number;
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
  tint?: number;
  uid?: number;
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
  }
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
            musicId: data.index,
            stattrak: item.statTrak ?? -1,
            uid: item.uid
          };
          break;
        case CS2ItemType.Collectible:
          collectible = { def: data.def };
          break;
        case CS2ItemType.Melee:
          assert(team);
          assert(data.def);
          knives[team] = hash({
            def: data.def,
            nametag: item.nameTag ?? "",
            paint: data.index ?? 0,
            seed: item.seed ?? CS2_MIN_SEED,
            stattrak: item.statTrak ?? -1,
            stickers: [],
            uid: item.uid,
            wear: item.getWear()
          });
          break;
        case CS2ItemType.Gloves:
          assert(team);
          assert(data.def);
          gloves[team] = hash({
            def: data.def,
            paint: data.index ?? 0,
            seed: item.seed ?? CS2_MIN_SEED,
            wear: item.getWear()
          });
          break;
        case CS2ItemType.Weapon:
          assert(data.def);
          const weapon = team === CS2Team.CT ? ctWeapons : tWeapons;
          weapon[data.def] = hash({
            def: data.def,
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
          });
          break;
        case CS2ItemType.Agent:
          assert(team);
          agents[team] = hash({
            def: data.def,
            stickers: data.somePatches().map(([index, patch]) => ({
              def: CS2Economy.getById(patch).index ?? 0,
              slot: index
            }))
          });
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
    collectible,
    ctWeapons,
    gloves,
    graffiti,
    knives,
    musicKit,
    tWeapons
  };
}
