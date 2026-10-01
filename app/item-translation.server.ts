/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { CS2EconomyItem, CS2ItemTranslation } from "@ianlucas/cs2-lib";
import { resolve } from "node:path";
import { isValidLanguage } from "~/data/languages";
import {
  loadItemTranslationMap,
  readItemTranslation
} from "~/item-translation-file.server";
import { getTranslationFileName } from "~/translation-files";

// Falls back to the item's own translation, which is English because that's
// the language the server economy is loaded with.
export async function getItemTranslation(
  item: CS2EconomyItem,
  language: string | undefined
): Promise<CS2ItemTranslation> {
  if (
    language === undefined ||
    language === "english" ||
    !isValidLanguage(language)
  ) {
    return item.language;
  }
  return (await findItemTranslation(language, item.id)) ?? item.language;
}

async function findItemTranslation(language: string, id: number) {
  if (import.meta.env.DEV) {
    return (await loadItemTranslationMap(language))[id];
  }
  const hash = __ITEM_TRANSLATION_HASH__;
  return readItemTranslation(
    resolve(
      "build/client/translations",
      getTranslationFileName("item", language, hash)
    ),
    resolve(
      "build/server/translations",
      getTranslationFileName("item", language, hash, "idx")
    ),
    id
  );
}
