/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, CS2_ITEMS } from "@ianlucas/cs2-lib";
import { RemixBrowser } from "@remix-run/react";
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";

CS2Economy.use({
  items: CS2_ITEMS,
  language: window.__itemLocalizationMap
});

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <RemixBrowser />
    </StrictMode>
  );
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/scripts/service-worker.js");
}
