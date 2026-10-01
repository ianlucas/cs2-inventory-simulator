/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";
import { clientGlobals, isServerContext, serverGlobals } from "~/globals";
import {
  fetchItemTranslationMap,
  fetchSystemTranslationMap
} from "~/translation-api.client";
import type { SystemTranslationTokens } from "~/translation.server";

export function useTranslation({
  itemLanguage,
  language
}: {
  itemLanguage: string;
  language: string;
}) {
  function getSystemTranslationMap() {
    return (
      (isServerContext
        ? (serverGlobals.systemTranslationByLanguage[language] ??
          serverGlobals.systemTranslationByLanguage.english)
        : clientGlobals.systemTranslationMap) ?? {}
    );
  }

  // The server keeps no item translations; the map is only used on the client,
  // to load the economy.
  function getItemTranslationMap() {
    return (
      (isServerContext ? undefined : clientGlobals.itemTranslationMap) ?? {}
    );
  }

  const systemMap = useTranslationMap(
    language,
    getSystemTranslationMap,
    fetchSystemTranslationMap,
    (map) => {
      clientGlobals.systemTranslationMap = map;
    }
  );
  const itemMap = useTranslationMap(
    itemLanguage,
    getItemTranslationMap,
    fetchItemTranslationMap,
    (map) => {
      clientGlobals.itemTranslationMap = map;
    }
  );

  function translate(token: SystemTranslationTokens, ...values: string[]) {
    return (
      systemMap[token]?.replace(
        /\{(\d+)\}/g,
        (_, index) => values[Number(index) - 1] ?? ""
      ) ?? ""
    );
  }

  return { system: systemMap, items: itemMap, translate };
}

function useTranslationMap<T>(
  language: string,
  getInitialMap: () => T,
  fetchMap: (language: string) => Promise<T>,
  onFetch: (map: T) => void
) {
  const [map, setMap] = useState(getInitialMap);

  useEffect(() => {
    let cancelled = false;
    fetchMap(language)
      .then((map) => {
        if (cancelled) {
          return;
        }
        onFetch(map);
        setMap(map);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [language]);

  return map;
}
