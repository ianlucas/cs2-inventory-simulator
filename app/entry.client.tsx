/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { config as fontAwesomeConfig } from "@fortawesome/fontawesome-svg-core";
import { CS2Economy, CS2_ITEMS } from "@ianlucas/cs2-lib";
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { type ClientOnErrorFunction, isRouteErrorResponse } from "react-router";
import { HydratedRouter } from "react-router/dom";
import { clientGlobals } from "./globals";
import { initClientMonitoring } from "./monitoring.client";
import { isNetworkError } from "./shared/fetch";
import { logError } from "./shared/monitoring";
import {
  fetchItemTranslationMap,
  fetchSystemTranslationMap
} from "./translation-api.client";

initClientMonitoring();

const handleRouteError: ClientOnErrorFunction = (error, { pattern }) => {
  if (!isRouteErrorResponse(error) && !isNetworkError(error)) {
    logError("Route failed.", { error, extra: { pattern } });
  }
};

function hydrate() {
  CS2Economy.load({
    items: CS2_ITEMS,
    language: clientGlobals.itemTranslationMap
  });

  fontAwesomeConfig.replacementClass = "";

  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <HydratedRouter onError={handleRouteError} />
      </StrictMode>
    );
  });
}

async function loadTranslationsAndHydrate() {
  const { itemLanguage = "english", language = "english" } =
    document.documentElement.dataset;
  try {
    const [systemTranslationMap, itemTranslationMap] = await Promise.all([
      fetchSystemTranslationMap(language),
      fetchItemTranslationMap(itemLanguage)
    ]);
    clientGlobals.systemTranslationMap = systemTranslationMap;
    clientGlobals.itemTranslationMap = itemTranslationMap;
  } catch (error) {
    if (!isNetworkError(error)) {
      logError("[InventorySimulator] Failed to load translations.", { error });
    }
  }
  hydrate();
}

loadTranslationsAndHydrate();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/scripts/service-worker.js");
}
