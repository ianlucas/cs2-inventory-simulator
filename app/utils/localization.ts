/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export function getSystemLocalization(key: string, language?: string) {
  return (
    typeof global !== "undefined"
      ? global.__systemLocalizationByLanguage[language ?? "english"]
      : window.__systemLocalizationMap
  )[key];
}
