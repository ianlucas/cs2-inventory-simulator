/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";
import { useLocalizationChecksum, usePreferences } from "./app-context";

export function LocalizationScript() {
  const checksum = useLocalizationChecksum();
  const { language } = usePreferences();
  const [isInitialized, setIsInitialized] = useState(false);
  const localizationUrl = `/localizations/${language}.${checksum}.js`;

  useEffect(() => {
    setIsInitialized(true);
    const script = document.createElement("script");
    script.src = localizationUrl;
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

  return <script key={language} src={localizationUrl} type="text/javascript" />;
}
