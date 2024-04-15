/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS_BaseInventoryItem,
  CS_Economy,
  CS_INVENTORY_STICKERS,
  CS_NONE,
  CS_TEAM_CT,
  CS_TEAM_T
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
}

export async function generate(
  inventory: CS_BaseInventoryItem[],
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
  const teams = [undefined, CS_TEAM_CT, CS_TEAM_T];
  let collectible: number | undefined;
  let musicKit: number | undefined;

  for (const item of inventory) {
    const data = CS_Economy.getById(item.id);

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
      if (team === CS_TEAM_CT && !item.equippedCT) {
        continue;
      }
      if (team === CS_TEAM_T && !item.equippedT) {
        continue;
      }
      switch (data.type) {
        case "patch":
          // Handled by "agents".
          break;
        case "musickit":
          musicKit = data.index;
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
            nametag: item.nametag ?? "",
            paint: data.index ?? 0,
            seed: item.seed ?? 1,
            stattrak: item.stattrak ?? -1,
            stickers: [],
            uid: item.uid,
            wear: item.wear ?? data.wearmin ?? 0
          };
          break;
        case "glove":
          assert(team);
          assert(data.def);
          gloves[team] = {
            def: data.def,
            paint: data.index ?? 0,
            seed: item.seed ?? 1,
            wear: item.wear ?? data.wearmin ?? 0
          };
          break;
        case "weapon":
          assert(data.def);
          const weapon = team === CS_TEAM_CT ? ctWeapons : tWeapons;
          weapon[data.def] = {
            def: data.def,
            legacy: data.legacy ?? false,
            nametag: item.nametag ?? "",
            paint: data.index ?? 0,
            seed: item.seed ?? 1,
            stattrak: item.stattrak ?? -1,
            stickers: (item.stickers ?? CS_INVENTORY_STICKERS).map(
              (sticker, index) => ({
                slot: index,
                wear: item.stickerswear?.[index] ?? 0,
                def:
                  sticker !== CS_NONE
                    ? CS_Economy.getById(sticker).index ?? 0
                    : 0
              })
            ),
            uid: item.uid,
            wear: item.wear ?? data.wearmin ?? 0
          };
          break;
        case "agent":
          assert(team);
          assert(data.model);
          const patch = inventory.find(
            (item) =>
              CS_Economy.getById(item.id).type === "patch" &&
              item[team === CS_TEAM_CT ? "equippedCT" : "equippedT"]
          );
          agents[team] = {
            model: data.model,
            patches: range(5).map(() =>
              patch !== undefined ? CS_Economy.getById(patch.id).index ?? 0 : 0
            )
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
