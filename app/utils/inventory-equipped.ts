/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS_Economy,
  CS_InventoryItem,
  CS_NO_STICKER,
  CS_NO_STICKER_WEAR,
  CS_TEAM_CT,
  CS_TEAM_T
} from "@ianlucas/cslib";

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
    .filter(
      (team) =>
        (team === CS_TEAM_T && equippedT) || (team === CS_TEAM_CT && equippedCT)
    )
    .forEach((team) => keyvalues.push([`${prefix}${team}${suffix}`, value]));
}

export function generate(inventory: CS_InventoryItem[]) {
  return Object.fromEntries(
    inventory
      .filter(
        ({ equipped, equippedCT, equippedT }) =>
          equipped || equippedCT || equippedT
      )
      .flatMap(
        ({
          equippedCT,
          equippedT,
          id,
          nametag,
          seed,
          stattrak,
          stickers,
          stickerswear,
          uid,
          wear
        }) => {
          const item = CS_Economy.getById(id);
          const keyvalues: [string, any][] = [];
          if (item.type === "musickit") {
            keyvalues.push([MUSIC_KIT_PREFIX, item.index]);
          }
          if (item.type === "pin") {
            keyvalues.push([PIN_PREFIX, item.def]);
          }
          if (item.type === "melee") {
            pushTeam(
              keyvalues,
              MELEE_PREFIX,
              equippedT,
              equippedCT,
              "",
              item.def
            );
          }
          if (item.type === "glove") {
            pushTeam(
              keyvalues,
              GLOVE_PREFIX,
              equippedT,
              equippedCT,
              "",
              item.def
            );
          }
          if (item.type === "agent") {
            pushTeam(
              keyvalues,
              AGENT_PREFIX,
              equippedT,
              equippedCT,
              "",
              item.def
            );
          }
          if (item.type === "patch") {
            pushTeam(
              keyvalues,
              AGENT_PATCH_PREFIX,
              equippedT,
              equippedCT,
              "",
              item.index
            );
          }
          if (nametag !== undefined) {
            pushTeam(
              keyvalues,
              NAMETAG_PREFIX,
              equippedT,
              equippedCT,
              `_${item.def}`,
              nametag
            );
          }
          if (seed !== undefined) {
            pushTeam(
              keyvalues,
              SEED_PREFIX,
              equippedT,
              equippedCT,
              `_${item.def}`,
              seed
            );
          }
          if (wear !== undefined) {
            pushTeam(
              keyvalues,
              WEAR_PREFIX,
              equippedT,
              equippedCT,
              `_${item.def}`,
              wear
            );
          }
          if (stattrak !== undefined) {
            pushTeam(
              keyvalues,
              STATTRAK_PREFIX,
              equippedT,
              equippedCT,
              `_${item.def}`,
              stattrak
            );
            pushTeam(
              keyvalues,
              STATTRAK_PREFIX,
              equippedT,
              equippedCT,
              `_${item.def}_u`,
              uid
            );
          }
          if (
            ["melee", "glove", "weapon"].includes(item.type) &&
            item.index !== undefined &&
            item.index !== 0
          ) {
            pushTeam(
              keyvalues,
              PAINT_PREFIX,
              equippedT,
              equippedCT,
              `_${item.def}`,
              item.index
            );
          }
          stickers?.forEach((sticker, slot) => {
            if (sticker !== CS_NO_STICKER) {
              pushTeam(
                keyvalues,
                STICKER_PREFIX,
                equippedT,
                equippedCT,
                `_${item.def}`,
                true
              );
              pushTeam(
                keyvalues,
                STICKER_PREFIX,
                equippedT,
                equippedCT,
                `_${item.def}_${slot}`,
                sticker
              );
              if (stickerswear?.[slot] !== CS_NO_STICKER_WEAR) {
                pushTeam(
                  keyvalues,
                  STICKERWEAR_PREFIX,
                  equippedT,
                  equippedCT,
                  `_${item.def}_${slot}`,
                  stickerswear?.[slot]
                );
              }
            }
          });
          return keyvalues;
        }
      )
  );
}
