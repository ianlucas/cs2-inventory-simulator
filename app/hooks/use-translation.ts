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

  const [systemTranslation, setSystemTranslation] = useState(
    getSystemTranslation()
  );

  const [itemsTranslation, setItemsTranslation] = useState(
    getItemsTranslation()
  );

  function translate(token: string, ...values: string[]) {
    token = token.replace(/\s/g, "");
    const value = systemTranslation[token];
    if (value === undefined) {
      return "";
    }
    return value.replace(/\{(\d+)\}/g, (_, index) => values[Number(index) - 1]);
  }

  useEffect(() => {
    function handleTranslationLoaded() {
      setSystemTranslation(getSystemTranslation());
      setItemsTranslation(getItemsTranslation());
    }
    window.addEventListener("translation-loaded", handleTranslationLoaded);
    return () => {
      window.removeEventListener("translation-loaded", handleTranslationLoaded);
    };
  }, []);

  return { systemTranslation, itemsTranslation, translate, checksum };
}
