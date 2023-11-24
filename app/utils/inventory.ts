/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Economy, CS_filterItems, CS_InventoryItem, CS_TEAM_CT, CS_TEAM_T } from "@ianlucas/cslib";
import { getCSItemName } from "./economy";
import { inventoryShape } from "./shapes";

export function parseInventory(inventory?: string | null) {
  if (!inventory) {
    return [];
  }
  try {
    return inventoryShape.parse(JSON.parse(inventory));
  } catch {
    return [];
  }
}

export function transform(inventoryItem: CS_InventoryItem, index: number) {
  const csItem = CS_Economy.getById(inventoryItem.id);
  return {
    csItem,
    inventoryItem,
    index,
    equipped: [
      inventoryItem.equipped && "text-white",
      inventoryItem.equippedCT && "text-sky-300",
      inventoryItem.equippedT && "text-yellow-400"
    ],
    ...getCSItemName(csItem)
  };
}

type TransformedInventoryItem = ReturnType<typeof transform>;

export function sortByName(
  a: TransformedInventoryItem,
  b: TransformedInventoryItem
) {
  return a.csItem.name.localeCompare(b.csItem.name);
}

const typeOrder = {
  "weapon": 0,
  "melee": 1,
  "glove": 2,
  "agent": 3,
  "patch": 4,
  "pin": 5,
  "musickit": 6,
  "graffiti": 7,
  "sticker": 8,
  "case": 9,
  "key": 10,
  "tool": 11
} as const;

export function sortByType(
  a: TransformedInventoryItem,
  b: TransformedInventoryItem
) {
  return typeOrder[a.csItem.type] - typeOrder[b.csItem.type];
}

export function sortByEquipped(
  a: TransformedInventoryItem,
  b: TransformedInventoryItem
) {
  const equippedA = a.inventoryItem.equipped || a.inventoryItem.equippedCT
    || a.inventoryItem.equippedT;
  const equippedB = b.inventoryItem.equipped || b.inventoryItem.equippedCT
    || b.inventoryItem.equippedT;
  if (equippedA && !equippedB) {
    return -1;
  } else if (!equippedA && equippedB) {
    return 1;
  } else {
    return 0;
  }
}

export function getFreeItemsToDisplay() {
  return CS_filterItems({
    free: true
  }).map((csItem, index) => ({
    csItem,
    inventoryItem: {
      id: csItem.id
    },
    index: -1 * (index + 1),
    equipped: [],
    ...getCSItemName(csItem)
  }));
}

export const MUSIC_KIT_PREFIX = "mk";
export const PIN_PREFIX = "pi";
export const MELEE_PREFIX = "me_";
export const GLOVE_PREFIX = "gl_";
export const AGENT_PREFIX = "ag_";
export const AGENT_PATCH_PREFIX = "ap_";
export const NAMETAG_PREFIX = "nt_";
export const SEED_PREFIX = "se_";
export const WEAR_PREFIX = "fl_";
export const STATTRAK_PREFIX = "st_";
export const PAINT_PREFIX = "pa_";
export const STICKER_PREFIX = "ss_";
export const STICKERWEAR_PREFIX = "sf_";

function pushTeam(
  keyvalues: [string, any][],
  prefix: string,
  equippedT: boolean | undefined,
  equippedCT: boolean | undefined,
  suffix: string,
  value: any
) {
  return [CS_TEAM_T, CS_TEAM_CT]
    .filter(team =>
      (team === CS_TEAM_T && equippedT)
      || (team === CS_TEAM_CT && equippedCT)
    )
    .forEach(team =>
      keyvalues.push([
        `${prefix}${team}${suffix}`,
        value
      ])
    );
}

export function transformEquipped(inventory: CS_InventoryItem[]) {
  return Object.fromEntries(
    inventory.filter(({ equipped, equippedCT, equippedT }) =>
      equipped || equippedCT || equippedT
    ).map(
      (
        {
          id,
          equippedCT,
          equippedT,
          nametag,
          stattrak,
          wear,
          seed,
          stickers,
          stickerswear
        }
      ) => {
        const csItem = CS_Economy.getById(id);
        const keyvalues: [string, any][] = [];
        if (csItem.type === "musickit") {
          keyvalues.push([MUSIC_KIT_PREFIX, csItem.itemid]);
        }
        if (csItem.type === "pin") {
          keyvalues.push([PIN_PREFIX, csItem.def]);
        }
        if (csItem.type === "melee") {
          pushTeam(
            keyvalues,
            MELEE_PREFIX,
            equippedT,
            equippedCT,
            "",
            csItem.def
          );
        }
        if (csItem.type === "glove") {
          pushTeam(
            keyvalues,
            GLOVE_PREFIX,
            equippedT,
            equippedCT,
            "",
            csItem.def
          );
        }
        if (csItem.type === "agent") {
          pushTeam(
            keyvalues,
            AGENT_PREFIX,
            equippedT,
            equippedCT,
            "",
            csItem.def
          );
        }
        if (csItem.type === "patch") {
          pushTeam(
            keyvalues,
            AGENT_PATCH_PREFIX,
            equippedT,
            equippedCT,
            "",
            csItem.itemid
          );
        }
        if (nametag !== undefined) {
          pushTeam(
            keyvalues,
            NAMETAG_PREFIX,
            equippedT,
            equippedCT,
            `_${csItem.def}`,
            nametag
          );
        }
        if (seed !== undefined) {
          pushTeam(
            keyvalues,
            SEED_PREFIX,
            equippedT,
            equippedCT,
            `_${csItem.def}`,
            seed
          );
        }
        if (wear !== undefined) {
          pushTeam(
            keyvalues,
            WEAR_PREFIX,
            equippedT,
            equippedCT,
            `_${csItem.def}`,
            wear
          );
        }
        if (stattrak !== undefined) {
          pushTeam(
            keyvalues,
            STATTRAK_PREFIX,
            equippedT,
            equippedCT,
            `_${csItem.def}`,
            stattrak
          );
        }
        if (
          ["melee", "glove", "weapon"].includes(csItem.type)
          && csItem.itemid !== undefined && csItem.itemid !== 0
        ) {
          pushTeam(
            keyvalues,
            PAINT_PREFIX,
            equippedT,
            equippedCT,
            `_${csItem.def}`,
            csItem.itemid
          );
        }
        stickers?.forEach((sticker, slot) => {
          if (sticker !== null) {
            pushTeam(
              keyvalues,
              STICKER_PREFIX,
              equippedT,
              equippedCT,
              `_${csItem.def}`,
              true
            );
            pushTeam(
              keyvalues,
              STICKER_PREFIX,
              equippedT,
              equippedCT,
              `_${csItem.def}_${slot}`,
              sticker
            );
            if (stickerswear?.[slot] !== null) {
              pushTeam(
                keyvalues,
                STICKERWEAR_PREFIX,
                equippedT,
                equippedCT,
                `_${csItem.def}_${slot}`,
                stickerswear?.[slot]
              );
            }
          }
        });
        return keyvalues;
      }
    ).flat()
  );
}
