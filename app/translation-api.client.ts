/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { CS2ItemTranslationByLanguage } from "@ianlucas/cs2-lib";

export async function fetchTranslation(language: string) {
  const url = `/translations/${language}.${__TRANSLATION_CHECKSUM__}.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return (await response.json()) as {
    systemTranslationMap: Record<string, string>;
    itemTranslationMap: CS2ItemTranslationByLanguage[string];
  };
}
