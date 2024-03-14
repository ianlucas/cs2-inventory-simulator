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

export const AGENT_MODEL_PREFIX = "agm_";
export const AGENT_PATCH_PREFIX = "ap_";
export const AGENT_PREFIX = "ag_";
export const CUSTOM_WEAPON_PREFIX = "cw_";
export const GLOVE_PREFIX = "gl_";
export const MELEE_PREFIX = "me_";
export const MUSIC_KIT_PREFIX = "mk";
export const NAMETAG_PREFIX = "nt_";
export const PAINT_LEGACY_PREFIX = "pal_";
export const PAINT_PREFIX = "pa_";
export const PIN_PREFIX = "pi";
export const SEED_PREFIX = "se_";
export const STATTRAK_PREFIX = "st_";
export const STATTRAK_UID_PREFIX = "stu_";
export const STICKER_PREFIX = "ss_";
export const STICKERWEAR_PREFIX = "sf_";
export const WEAR_PREFIX = "fl_";

function add(
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
          let custom = false;

          if (item.type === "musickit") {
            keyvalues.push([MUSIC_KIT_PREFIX, item.index]);
          }
          if (item.type === "pin") {
            keyvalues.push([PIN_PREFIX, item.def]);
          }
          if (item.type === "melee") {
            custom = true;
            add(keyvalues, MELEE_PREFIX, equippedT, equippedCT, "", item.def);
          }
          if (item.type === "glove") {
            custom = true;
            add(keyvalues, GLOVE_PREFIX, equippedT, equippedCT, "", item.def);
          }
          if (item.type === "agent") {
            add(keyvalues, AGENT_PREFIX, equippedT, equippedCT, "", item.def);
            if (item.model !== undefined) {
              add(
                keyvalues,
                AGENT_MODEL_PREFIX,
                equippedT,
                equippedCT,
                "",
                item.model
              );
            }
          }
          if (item.type === "patch") {
            add(
              keyvalues,
              AGENT_PATCH_PREFIX,
              equippedT,
              equippedCT,
              "",
              item.index
            );
          }
          if (nametag !== undefined) {
            custom = true;
            add(
              keyvalues,
              NAMETAG_PREFIX,
              equippedT,
              equippedCT,
              `_${item.def}`,
              nametag
            );
          }
          if (seed !== undefined) {
            custom = true;
            add(
              keyvalues,
              SEED_PREFIX,
              equippedT,
              equippedCT,
              `_${item.def}`,
              seed
            );
          }
          if (wear !== undefined) {
            custom = true;
            add(
              keyvalues,
              WEAR_PREFIX,
              equippedT,
              equippedCT,
              `_${item.def}`,
              wear
            );
          }
          if (stattrak !== undefined) {
            custom = true;
            add(
              keyvalues,
              STATTRAK_PREFIX,
              equippedT,
              equippedCT,
              `_${item.def}`,
              stattrak
            );
            add(
              keyvalues,
              STATTRAK_UID_PREFIX,
              equippedT,
              equippedCT,
              `_${item.def}`,
              uid
            );
          }
          if (
            ["melee", "glove", "weapon"].includes(item.type) &&
            item.index !== undefined &&
            item.index !== 0
          ) {
            custom = true;
            add(
              keyvalues,
              PAINT_PREFIX,
              equippedT,
              equippedCT,
              `_${item.def}`,
              item.index
            );
          }
          if (item.legacy) {
            add(
              keyvalues,
              PAINT_LEGACY_PREFIX,
              equippedT,
              equippedCT,
              `_${item.def}`,
              item.legacy
            );
          }
          stickers?.forEach((sticker, slot) => {
            if (sticker !== CS_NO_STICKER) {
              custom = true;
              add(
                keyvalues,
                STICKER_PREFIX,
                equippedT,
                equippedCT,
                `_${item.def}`,
                true
              );
              add(
                keyvalues,
                STICKER_PREFIX,
                equippedT,
                equippedCT,
                `_${item.def}_${slot}`,
                CS_Economy.getById(sticker).index
              );
              if (stickerswear?.[slot] !== CS_NO_STICKER_WEAR) {
                add(
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
          if (custom) {
            add(
              keyvalues,
              CUSTOM_WEAPON_PREFIX,
              equippedT,
              equippedCT,
              `_${item.def}`,
              true
            );
          }
          return keyvalues;
        }
      )
  );
}
