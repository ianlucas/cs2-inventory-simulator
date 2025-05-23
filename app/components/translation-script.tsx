/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";
import { usePreferences } from "./app-context";

export function TranslationScript() {
  const { language } = usePreferences();
  const [isInitialized, setIsInitialized] = useState(false);
  const translationUrl = `/translations/${language}.${__TRANSLATION_CHECKSUM__}.js`;

  useEffect(() => {
    setIsInitialized(true);
    const script = document.createElement("script");
    script.src = translationUrl;
    script.type = "text/javascript";
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [language]);

  if (isInitialized) {
    return null;
  }

  return <script key={language} src={translationUrl} type="text/javascript" />;
}
