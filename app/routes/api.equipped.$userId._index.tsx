import { LoaderFunctionArgs } from "@remix-run/node";
import { CS_Economy, CS_TEAM_CT, CS_TEAM_T } from "cslib";
import { z } from "zod";
import { useUserCache } from "~/models/user-cache.server";

const MUSIC_KIT_PREFIX = "mk";
const PIN_PREFIX = "pi";
const MELEE_PREFIX = "me_";
const GLOVE_PREFIX = "gl_";
const AGENT_PREFIX = "ag_";
const AGENT_PATCH_PREFIX = "ap_";
const NAMETAG_PREFIX = "nt_";
const SEED_PREFIX = "se_";
const FLOAT_PREFIX = "fl_";
const STATTRAK_PREFIX = "st_";
const PAINT_PREFIX = "pa_";
const STICKER_PREFIX = "ss_";
const STICKERFLOAT_PREFIX = "sf_";

export const ApiEquippedUserIdUrl = "/api/equipped/$userId";

function team(
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

export async function loader({ params }: LoaderFunctionArgs) {
  const userId = z.string().parse(params.userId);
  return await useUserCache({
    url: ApiEquippedUserIdUrl,
    userId,
    throwData: {},
    generate(inventory) {
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
              float,
              seed,
              stickers,
              stickersfloat
            }
          ) => {
            const csItem = CS_Economy.getById(id);
            const csDef = CS_Economy.getDefById(id);
            const keyvalues: [string, any][] = [];
            if (csItem.type === "musickit") {
              keyvalues.push([MUSIC_KIT_PREFIX, csDef.itemid]);
            }
            if (csItem.type === "pin") {
              keyvalues.push([PIN_PREFIX, csDef.def]);
            }
            if (csItem.type === "melee") {
              team(
                keyvalues,
                MELEE_PREFIX,
                equippedT,
                equippedCT,
                "",
                csDef.def
              );
            }
            if (csItem.type === "glove") {
              team(
                keyvalues,
                GLOVE_PREFIX,
                equippedT,
                equippedCT,
                "",
                csDef.def
              );
            }
            if (csItem.type === "agent") {
              team(
                keyvalues,
                AGENT_PREFIX,
                equippedT,
                equippedCT,
                "",
                csDef.def
              );
            }
            if (csItem.type === "patch") {
              team(
                keyvalues,
                AGENT_PATCH_PREFIX,
                equippedT,
                equippedCT,
                "",
                csDef.itemid
              );
            }
            if (nametag !== undefined) {
              team(
                keyvalues,
                NAMETAG_PREFIX,
                equippedT,
                equippedCT,
                `_${csDef.def}`,
                nametag
              );
            }
            if (seed !== undefined) {
              team(
                keyvalues,
                SEED_PREFIX,
                equippedT,
                equippedCT,
                `_${csDef.def}`,
                seed
              );
            }
            if (float !== undefined) {
              team(
                keyvalues,
                FLOAT_PREFIX,
                equippedT,
                equippedCT,
                `_${csDef.def}`,
                float
              );
            }
            if (stattrak) {
              team(
                keyvalues,
                STATTRAK_PREFIX,
                equippedT,
                equippedCT,
                `_${csDef.def}`,
                stattrak
              );
            }
            if (
              ["melee", "glove", "weapon"].includes(csItem.type)
              && csDef.itemid !== undefined && csDef.itemid !== 0
            ) {
              team(
                keyvalues,
                PAINT_PREFIX,
                equippedT,
                equippedCT,
                `_${csDef.def}`,
                csDef.itemid
              );
            }
            stickers?.forEach((sticker, slot) => {
              if (sticker !== null) {
                team(
                  keyvalues,
                  STICKER_PREFIX,
                  equippedT,
                  equippedCT,
                  `_${csDef.def}`,
                  true
                );
                team(
                  keyvalues,
                  STICKER_PREFIX,
                  equippedT,
                  equippedCT,
                  `_${csDef.def}_${slot}`,
                  sticker
                );
                if (stickersfloat?.[slot] !== null) {
                  team(
                    keyvalues,
                    STICKERFLOAT_PREFIX,
                    equippedT,
                    equippedCT,
                    `_${csDef.def}_${slot}`,
                    stickersfloat?.[slot]
                  );
                }
              }
            });
            return keyvalues;
          }
        ).flat()
      );
    }
  });
}
