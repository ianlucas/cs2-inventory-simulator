/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2ItemLocalizationByLanguage } from "@ianlucas/cs2-lib";
import { createHash } from "crypto";
import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import { z } from "zod";
import { brazilian } from "~/localization/brazilian";
import { bulgarian } from "~/localization/bulgarian";
import { czech } from "~/localization/czech";
import { danish } from "~/localization/danish";
import { dutch } from "~/localization/dutch";
import { english } from "~/localization/english";
import { finnish } from "~/localization/finnish";
import { french } from "~/localization/french";
import { german } from "~/localization/german";
import { greek } from "~/localization/greek";
import { hungarian } from "~/localization/hungarian";
import { italian } from "~/localization/italian";
import { japanese } from "~/localization/japanese";
import { koreana } from "~/localization/koreana";
import { latam } from "~/localization/latam";
import { norwegian } from "~/localization/norwegian";
import { polish } from "~/localization/polish";
import { portuguese } from "~/localization/portuguese";
import { romanian } from "~/localization/romanian";
import { russian } from "~/localization/russian";
import { schinese } from "~/localization/schinese";
import { spanish } from "~/localization/spanish";
import { swedish } from "~/localization/swedish";
import { tchinese } from "~/localization/tchinese";
import { thai } from "~/localization/thai";
import { turkish } from "~/localization/turkish";
import { ukrainian } from "~/localization/ukrainian";
import { vietnamese } from "~/localization/vietnamese";

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
    "node_modules/@ianlucas/cs2-lib/assets/translations"
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
