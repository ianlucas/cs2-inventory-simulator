/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2Economy,
  CS2InventoryData,
  CS2Team,
  mapAllStickers
} from "@ianlucas/cs2-lib";
import { assert } from "./misc";
import { range } from "./number";

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
    slot: number;
    wear: number;
  }[];
  uid: number;
}

interface AgentItem {
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

export async function generate(
  inventory: CS2InventoryData,
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
  let musicKit: MusicKitItem | undefined;

  for (const [uid, item] of Object.entries(inventory.items)) {
    const intUid = parseInt(uid, 10);
    const data = CS2Economy.getById(item.id);

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
        case "patch":
          // Handled by "agents".
          break;
        case "musickit":
          assert(data.index);
          musicKit = {
            def: data.index,
            stattrak: item.statTrak ?? -1,
            uid: intUid
          };
          break;
        case "collectible":
          collectible = data.def;
          break;
        case "melee":
          assert(team);
          assert(data.def);
          knives[team] = {
            def: data.def,
            legacy: false,
            nametag: item.nameTag ?? "",
            paint: data.index ?? 0,
            seed: item.seed ?? 1,
            stattrak: item.statTrak ?? -1,
            stickers: [],
            uid: intUid,
            wear: item.wear ?? data.wearMin ?? 0
          };
          break;
        case "gloves":
          assert(team);
          assert(data.def);
          gloves[team] = {
            def: data.def,
            paint: data.index ?? 0,
            seed: item.seed ?? 1,
            wear: item.wear ?? data.wearMin ?? 0
          };
          break;
        case "weapon":
          assert(data.def);
          const weapon = team === CS2Team.CT ? ctWeapons : tWeapons;
          weapon[data.def] = {
            def: data.def,
            legacy: data.legacy ?? false,
            nametag: item.nameTag ?? "",
            paint: data.index ?? 0,
            seed: item.seed ?? 1,
            stattrak: item.statTrak ?? -1,
            stickers: mapAllStickers(item.stickers).map((sticker, index) => ({
              slot: index,
              wear: item.stickerswear?.[index] ?? 0,
              def:
                sticker !== CS_NONE ? CS2Economy.getById(sticker).index ?? 0 : 0
            })),
            uid: item.uid,
            wear: item.wear ?? data.wearmin ?? 0
          };
          break;
        case "agent":
          assert(team);
          assert(data.model);
          assert(data.voprefix);
          const patch = inventory.find(
            (item) =>
              CS2Economy.getById(item.id).type === "patch" &&
              item[team === CS2Team.CT ? "equippedCT" : "equippedT"]
          );
          agents[team] = {
            model: data.model,
            patches: range(5).map(() =>
              patch !== undefined ? CS2Economy.getById(patch.id).index ?? 0 : 0
            ),
            vofallback: data.voFallback ?? false,
            vofemale: data.voFemale ?? false,
            voprefix: data.voPrefix
          };
          break;
      }
    }
  }

  return {
    agents,
    ctWeapons,
    gloves,
    knives,
    musicKit,
    pin: collectible,
    tWeapons
  };
}
