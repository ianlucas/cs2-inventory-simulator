/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2ItemLocalizationByLanguage } from "@ianlucas/cs2-lib";
import { createHash } from "crypto";
import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import { z } from "zod";
import { brazilian } from "~/localizations/brazilian";
import { bulgarian } from "~/localizations/bulgarian";
import { czech } from "~/localizations/czech";
import { danish } from "~/localizations/danish";
import { dutch } from "~/localizations/dutch";
import { english } from "~/localizations/english";
import { finnish } from "~/localizations/finnish";
import { french } from "~/localizations/french";
import { german } from "~/localizations/german";
import { greek } from "~/localizations/greek";
import { hungarian } from "~/localizations/hungarian";
import { italian } from "~/localizations/italian";
import { japanese } from "~/localizations/japanese";
import { koreana } from "~/localizations/koreana";
import { latam } from "~/localizations/latam";
import { norwegian } from "~/localizations/norwegian";
import { polish } from "~/localizations/polish";
import { portuguese } from "~/localizations/portuguese";
import { romanian } from "~/localizations/romanian";
import { russian } from "~/localizations/russian";
import { schinese } from "~/localizations/schinese";
import { spanish } from "~/localizations/spanish";
import { swedish } from "~/localizations/swedish";
import { tchinese } from "~/localizations/tchinese";
import { thai } from "~/localizations/thai";
import { turkish } from "~/localizations/turkish";
import { ukrainian } from "~/localizations/ukrainian";
import { vietnamese } from "~/localizations/vietnamese";

export type SystemLocalizationByLanguage = Record<
  string,
  Record<string, string>
>;
export type SystemLocalizationTokens = keyof typeof english;

declare global {
  var __systemLocalizationByLanguage: SystemLocalizationByLanguage;
  var __itemLocalizationByLanguage: CS2ItemLocalizationByLanguage;

  interface Window {
    __systemLocalizationMap: SystemLocalizationByLanguage[string];
    __itemLocalizationMap: CS2ItemLocalizationByLanguage[string];
  }
}

function readItemLocalization() {
  const itemLocalizationByLanguage: CS2ItemLocalizationByLanguage = {};
  const directory = resolve(
    process.cwd(),
    "node_modules/@ianlucas/cs2-lib/assets/localizations"
  );
  const files = readdirSync(directory);
  for (const file of files) {
    const language = file.replace(/^items-|\.json$/g, "");
    itemLocalizationByLanguage[language] = z
      .record(
        z.object({
          category: z.string().optional(),
          collectionDesc: z.string().optional(),
          collectionName: z.string().optional(),
          desc: z.string().optional(),
          name: z.string(),
          tournamentDesc: z.string().optional()
        })
      )
      .parse(JSON.parse(readFileSync(resolve(directory, file), "utf-8")));
  }
  return itemLocalizationByLanguage;
}

export function setupTranslation() {
  global.__systemLocalizationByLanguage = {
    brazilian,
    bulgarian,
    czech,
    danish,
    dutch,
    english,
    finnish,
    french,
    german,
    greek,
    hungarian,
    italian,
    japanese,
    koreana,
    latam,
    norwegian,
    polish,
    portuguese,
    romanian,
    russian,
    schinese,
    spanish,
    swedish,
    tchinese,
    thai,
    turkish,
    ukrainian,
    vietnamese
  };

  global.__itemLocalizationByLanguage = readItemLocalization();
}

let checksum: string | undefined;
export function getLocalizationChecksum() {
  if (checksum !== undefined) {
    return checksum;
  }
  checksum = createHash("sha256")
    .update(
      "v3" +
        JSON.stringify(global.__systemLocalizationByLanguage) +
        JSON.stringify(global.__itemLocalizationByLanguage)
    )
    .digest("hex")
    .substring(0, 7);
  return checksum;
}
