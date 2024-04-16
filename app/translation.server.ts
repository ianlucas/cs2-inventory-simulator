/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_ItemTranslations } from "@ianlucas/cs2-lib";
import { createHash } from "crypto";
import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import { z } from "zod";
import { brazilian } from "~/translations/brazilian";
import { english } from "~/translations/english";

export type SystemTranslations = Record<string, Record<string, string>>;

declare global {
  var $systemTranslations: SystemTranslations;
  var $itemsTranslations: CS_ItemTranslations;

  interface Window {
    $systemTranslation: SystemTranslations[string];
    $itemsTranslation: CS_ItemTranslations[string];
  }
}

function readItemTranslations() {
  const itemsTranslations: CS_ItemTranslations = {};
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
    english
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
