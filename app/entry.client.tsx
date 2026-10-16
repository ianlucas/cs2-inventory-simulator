/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { config as fontAwesomeConfig } from "@fortawesome/fontawesome-svg-core";
import { faFrown } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CS2Economy, CS2_ITEMS } from "@ianlucas/cs2-lib";
import { StrictMode, startTransition } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { type ClientOnErrorFunction, isRouteErrorResponse } from "react-router";
import { HydratedRouter } from "react-router/dom";
import { ConnectionError } from "./components/connection-error";
import { errorBoundaryEnglish } from "./data/error-boundary-english";
import { clientGlobals } from "./globals";
import { initClientMonitoring } from "./monitoring.client";
import { isNetworkError } from "./shared/fetch";
import { logError } from "./shared/monitoring";
import {
  fetchItemTranslationMap,
  fetchSystemTranslationMap
} from "./translation-api.client";

initClientMonitoring();

fontAwesomeConfig.replacementClass = "";

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

  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <HydratedRouter onError={handleRouteError} />
      </StrictMode>
    );
  });
}

function renderConnectionError() {
  const container = document.createElement("div");
  container.className = "lg:w-5xl";
  document.body.className =
    "flex h-screen w-screen items-center justify-center bg-blue-500 font-mono text-white";
  document.body.replaceChildren(container);
  createRoot(container).render(
    <>
      <FontAwesomeIcon icon={faFrown} className="h-16" />
      <ConnectionError translate={(token) => errorBoundaryEnglish[token]} />
    </>
  );
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
    renderConnectionError();
    return;
  }
  hydrate();
}

loadTranslationsAndHydrate();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/scripts/service-worker.js")
    .catch(() => {});
}
