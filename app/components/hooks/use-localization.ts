/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";
import { clientGlobals, isServerContext, serverGlobals } from "~/globals";
import type { SystemLocalizationTokens } from "~/localization.server";

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
      (isServerContext
        ? (serverGlobals.systemLocalizationByLanguage[language] ??
          serverGlobals.systemLocalizationByLanguage.english)
        : clientGlobals.systemLocalizationMap) ?? {}
    );
  }

  function getItemLocalizationMap() {
    return (
      (isServerContext
        ? serverGlobals.itemLocalizationByLanguage[language]
        : clientGlobals.itemLocalizationMap) ?? {}
    );
  }

  const [systemMap, setSystemMap] = useState(getSystemLocalizationMap());
  const [itemMap, setItemMap] = useState(getItemLocalizationMap());

  function localize(token: SystemLocalizationTokens, ...values: string[]) {
    return (
      systemMap[token]?.replace(
        /\{(\d+)\}/g,
        (_, index) => values[Number(index) - 1]
      ) ?? ""
    );
  }

  useEffect(() => {
    function handleLocalizationLoaded() {
      setSystemMap(getSystemLocalizationMap());
      setItemMap(getItemLocalizationMap());
    }
    window.addEventListener(LOCALIZATION_LOADED_TYPE, handleLocalizationLoaded);
    return () => {
      window.removeEventListener(
        LOCALIZATION_LOADED_TYPE,
        handleLocalizationLoaded
      );
    };
  }, []);

  return { system: systemMap, items: itemMap, localize, checksum };
}
