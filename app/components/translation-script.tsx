/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";
import { usePreferences, useTranslationChecksum } from "./app-context";

export function TranslationScript() {
  const checksum = useTranslationChecksum();
  const { language } = usePreferences();
  const [isInitialized, setIsInitialized] = useState(false);
  const translationUrl = `/translations/${language}.${checksum}.js`;

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
  }, [checksum, language]);

  if (isInitialized) {
    return null;
  }

  return <script key={language} src={translationUrl} type="text/javascript" />;
}
