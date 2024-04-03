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
} from "@ianlucas/cslib";
import { assert } from "./misc";
import { range } from "./number";

interface BaseEconItem {
  def: number;
  paint: number;
  seed: number;
  wear: number;
}

interface WeaponEconItem extends BaseEconItem {
  nametag: string;
  stattrak: number;
  stickers: {
    slot: number;
    wear: number;
    def: number;
  }[];
}

interface KnifeEconItem extends BaseEconItem {
  stattrak: number;
}

interface AgentItem {
  model: string;
  patches: number[];
}

export function generate(inventory: CS_BaseInventoryItem[]) {
  const knives: Record<number, KnifeEconItem> = {};
  const gloves: Record<number, BaseEconItem> = {};
  const tWeapons: Record<number, WeaponEconItem> = {};
  const ctWeapons: Record<number, WeaponEconItem> = {};
  const agents: Record<number, AgentItem> = {};
  const teams = [undefined, CS_TEAM_CT, CS_TEAM_T];
  let pin: number | undefined;
  let musicKit: number | undefined;

  for (const item of inventory) {
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
      const data = CS_Economy.getById(item.id);
      switch (data.type) {
        case "patch":
          // Handled by "agents".
          break;
        case "musickit":
          musicKit = data.index;
          break;
        case "pin":
          pin = data.def;
          break;
        case "melee":
          assert(team);
          assert(data.def);
          knives[team] = {
            def: data.def,
            paint: data.index ?? 0,
            seed: item.seed ?? 1,
            stattrak: item.stattrak ?? -1,
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
    pin,
    tWeapons
  };
}
