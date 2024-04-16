/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";
import { useAppContext } from "./app-context";

export function TranslationScript() {
  const {
    preferences: { language },
    translations: { checksum }
  } = useAppContext();

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setIsInitialized(true);
    const script = document.createElement("script");
    script.src = `/translation/${language}.${checksum}.js`;
    script.type = "text/javascript";
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [checksum, language]);

  if (isInitialized) {
    return null;
  }

  return (
    <script
      key={language}
      src={`/translation/${language}.${checksum}.js`}
      type="text/javascript"
    />
  );
}
