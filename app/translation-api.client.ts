/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { CS2ItemTranslationByLanguage } from "@ianlucas/cs2-lib";
import {
  getTranslationFileName,
  type TranslationKind
} from "~/translation-files";

export async function fetchTranslation(language: string) {
  const [systemTranslationMap, itemTranslationMap] = await Promise.all([
    fetchTranslationFile<Record<string, string>>(
      "ui",
      language,
      __UI_TRANSLATION_HASH__
    ),
    fetchTranslationFile<CS2ItemTranslationByLanguage[string]>(
      "item",
      language,
      __ITEM_TRANSLATION_HASH__
    )
  ]);
  return { systemTranslationMap, itemTranslationMap };
}

async function fetchTranslationFile<T>(
  kind: TranslationKind,
  language: string,
  hash: string
) {
  const url = `/translations/${getTranslationFileName(kind, language, hash)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}
