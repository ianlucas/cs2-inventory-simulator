/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { clientGlobals, isServerContext, serverGlobals } from "../globals";

export function getSystemTranslation(key: string, language?: string) {
  return (
    isServerContext
      ? serverGlobals.systemTranslationByLanguage[language ?? "english"]
      : clientGlobals.systemTranslationMap
  )[key];
}
