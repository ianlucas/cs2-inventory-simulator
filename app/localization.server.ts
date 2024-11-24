/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2ItemLocalizationByLanguage } from "@ianlucas/cs2-lib";
import { createHash } from "crypto";
import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import { z } from "zod";
import * as languages from "~/localizations";
import { serverGlobals } from "./globals";

export type SystemLocalizationByLanguage = Record<
  string,
  Record<string, string>
>;
export type SystemLocalizationTokens = keyof (typeof languages)["english"];

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

export function setupLocalization() {
  serverGlobals.systemLocalizationByLanguage = languages;
  serverGlobals.itemLocalizationByLanguage = readItemLocalization();
}

let checksum: string | undefined;
export function getLocalizationChecksum() {
  if (checksum !== undefined) {
    return checksum;
  }
  checksum = createHash("sha256")
    .update(
      "v4" +
        JSON.stringify(serverGlobals.systemLocalizationByLanguage) +
        JSON.stringify(serverGlobals.itemLocalizationByLanguage)
    )
    .digest("hex")
    .substring(0, 7);
  return checksum;
}
