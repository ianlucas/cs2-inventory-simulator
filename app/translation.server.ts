/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2ItemLocalizationByLanguage } from "@ianlucas/cs2-lib";
import { createHash } from "crypto";
import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import { z } from "zod";
import { brazilian } from "~/translations/brazilian";
import { bulgarian } from "~/translations/bulgarian";
import { czech } from "~/translations/czech";
import { danish } from "~/translations/danish";
import { dutch } from "~/translations/dutch";
import { english } from "~/translations/english";
import { finnish } from "~/translations/finnish";
import { french } from "~/translations/french";
import { german } from "~/translations/german";
import { greek } from "~/translations/greek";
import { hungarian } from "~/translations/hungarian";
import { italian } from "~/translations/italian";
import { japanese } from "~/translations/japanese";
import { koreana } from "~/translations/koreana";
import { latam } from "~/translations/latam";
import { norwegian } from "~/translations/norwegian";
import { polish } from "~/translations/polish";
import { portuguese } from "~/translations/portuguese";
import { romanian } from "~/translations/romanian";
import { russian } from "~/translations/russian";
import { schinese } from "~/translations/schinese";
import { spanish } from "~/translations/spanish";
import { swedish } from "~/translations/swedish";
import { tchinese } from "~/translations/tchinese";
import { thai } from "~/translations/thai";
import { turkish } from "~/translations/turkish";
import { ukrainian } from "~/translations/ukrainian";
import { vietnamese } from "~/translations/vietnamese";

export type SystemTranslations = Record<string, Record<string, string>>;

declare global {
  var $systemTranslations: SystemTranslations;
  var $itemsTranslations: CS2ItemLocalizationByLanguage;

  interface Window {
    $systemTranslation: SystemTranslations[string];
    $itemsTranslation: CS2ItemLocalizationByLanguage[string];
  }
}

function readItemTranslations() {
  const itemsTranslations: CS2ItemLocalizationByLanguage = {};
  const directory = resolve(
    process.cwd(),
    "node_modules/@ianlucas/cs2-lib/assets/translations"
  );
  const files = readdirSync(directory);
  for (const file of files) {
    const language = file.replace(/^items-|\.json$/g, "");
    itemsTranslations[language] = z
      .record(z.record(z.string()))
      .parse(JSON.parse(readFileSync(resolve(directory, file), "utf-8")));
  }
  return itemsTranslations;
}

export function setupTranslation() {
  global.$systemTranslations = {
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

  global.$itemsTranslations = readItemTranslations();
}

let checksum: string | undefined;
export function getTranslationChecksum() {
  if (checksum !== undefined) {
    return checksum;
  }
  checksum = createHash("sha256")
    .update(
      "v3" +
        JSON.stringify(global.$systemTranslations) +
        JSON.stringify(global.$itemsTranslations)
    )
    .digest("hex")
    .substring(0, 7);
  return checksum;
}
