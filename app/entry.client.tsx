/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { config as fontAwesomeConfig } from "@fortawesome/fontawesome-svg-core";
import { CS2Economy, CS2_ITEMS } from "@ianlucas/cs2-lib";
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { TRANSLATION_LOADED_TYPE } from "./components/hooks/use-translation";
import { clientGlobals } from "./globals";

function hydrate() {
  window.removeEventListener(TRANSLATION_LOADED_TYPE, hydrate);

  CS2Economy.use({
    items: CS2_ITEMS,
    language: clientGlobals.itemTranslationMap
  });

  fontAwesomeConfig.replacementClass = "";

  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <HydratedRouter />
      </StrictMode>
    );
  });
}

if (clientGlobals.isTranslationLoaded) {
  hydrate();
} else {
  window.addEventListener(TRANSLATION_LOADED_TYPE, hydrate);
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/scripts/service-worker.js");
}
