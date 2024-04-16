/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";

export function useTranslation({
  language,
  checksum
}: {
  language: string;
  checksum: string;
}) {
  function getSystemTranslation() {
    return (
      (typeof global !== "undefined"
        ? global.$systemTranslations[language] ??
          global.$systemTranslations.english
        : window.$systemTranslation) ?? {}
    );
  }

  function getItemsTranslation() {
    return (
      (typeof global !== "undefined"
        ? global.$itemsTranslations[language]
        : window.$itemsTranslation) ?? {}
    );
  }

  const [system, setSystem] = useState(getSystemTranslation());

  const [items, setItems] = useState(getItemsTranslation());

  function translate(token: string, ...values: string[]) {
    token = token.replace(/\s/g, "");
    const value = system[token];
    if (value === undefined) {
      return "";
    }
    return value.replace(/\{(\d+)\}/g, (_, index) => values[Number(index) - 1]);
  }

  useEffect(() => {
    function handleTranslationLoaded() {
      setSystem(getSystemTranslation());
      setItems(getItemsTranslation());
    }
    window.addEventListener("translationloaded", handleTranslationLoaded);
    return () => {
      window.removeEventListener("translationloaded", handleTranslationLoaded);
    };
  }, []);

  return { system, items, translate, checksum };
}
