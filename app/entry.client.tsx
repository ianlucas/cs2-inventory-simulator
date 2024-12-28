/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, CS2_ITEMS } from "@ianlucas/cs2-lib";
import { HydratedRouter } from "react-router/dom";
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { clientGlobals } from "./globals";

CS2Economy.use({
  items: CS2_ITEMS,
  language: clientGlobals.itemLocalizationMap
});

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/scripts/service-worker.js");
}
