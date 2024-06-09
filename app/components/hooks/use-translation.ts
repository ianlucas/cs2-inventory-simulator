/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";
import { SystemLocalizationTokens } from "~/localization.server";

export const LOCALIZATION_LOADED_TYPE = "localizationloaded";

export function useLocalization({
  language,
  checksum
}: {
  language: string;
  checksum: string;
}) {
  function getSystemLocalizationMap() {
    return (
      (typeof global !== "undefined"
        ? global.__systemLocalizationByLanguage[language] ??
          global.__systemLocalizationByLanguage.english
        : window.__systemLocalizationMap) ?? {}
    );
  }

  function getItemLocalizationMap() {
    return (
      (typeof global !== "undefined"
        ? global.__itemLocalizationByLanguage[language]
        : window.__itemLocalizationMap) ?? {}
    );
  }

  const [systemMap, setSystemMap] = useState(getSystemLocalizationMap());
  const [itemMap, setItemMap] = useState(getItemLocalizationMap());

  function localize(token: SystemLocalizationTokens, ...values: string[]) {
    const value = systemMap[token];
    if (value === undefined) {
      return "";
    }
    return value.replace(/\{(\d+)\}/g, (_, index) => values[Number(index) - 1]);
  }

  useEffect(() => {
    function handleTranslationLoaded() {
      setSystemMap(getSystemLocalizationMap());
      setItemMap(getItemLocalizationMap());
    }
    window.addEventListener(LOCALIZATION_LOADED_TYPE, handleTranslationLoaded);
    return () => {
      window.removeEventListener(
        LOCALIZATION_LOADED_TYPE,
        handleTranslationLoaded
      );
    };
  }, []);

  return { system: systemMap, items: itemMap, localize, checksum };
}
