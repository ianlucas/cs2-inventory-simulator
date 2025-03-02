/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as itemTranslations from "@ianlucas/cs2-lib/translations";
import { createHash } from "crypto";
import * as languages from "~/translations";
import { serverGlobals } from "./globals";

export type SystemTranslationByLanguage = Record<
  string,
  Record<string, string>
>;
export type SystemTranslationTokens = keyof (typeof languages)["english"];

export function setupTranslation() {
  serverGlobals.systemTranslationByLanguage = languages;
  serverGlobals.itemTranslationByLanguage = itemTranslations;
}

let checksum: string | undefined;
export function getTranslationChecksum() {
  if (checksum !== undefined) {
    return checksum;
  }
  checksum = createHash("sha256")
    .update(
      "v4" +
        JSON.stringify(serverGlobals.systemTranslationByLanguage) +
        JSON.stringify(serverGlobals.itemTranslationByLanguage)
    )
    .digest("hex")
    .substring(0, 7);
  return checksum;
}
