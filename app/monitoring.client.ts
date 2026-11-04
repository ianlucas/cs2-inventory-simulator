/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as Sentry from "@sentry/browser";
import { isbot } from "isbot";
import { isAbortError, isNetworkError } from "./shared/fetch";

function isSupportedBrowser() {
  return CSS.supports("color", "color-mix(in srgb, red, red)");
}

export function initClientMonitoring() {
  const { sentryDsn: dsn, sentryEnvironment: environment } =
    document.documentElement.dataset;
  if (
    import.meta.env.DEV ||
    dsn === undefined ||
    isbot(navigator.userAgent) ||
    !isSupportedBrowser()
  ) {
    return;
  }
  Sentry.init({
    dsn,
    environment,
    release: __SOURCE_COMMIT__,
    sampleRate: 1,
    allowUrls: [window.location.origin],
    ignoreErrors: [
      /ResizeObserver loop/,
      "Non-Error promise rejection captured",
      /^TimeoutError: /
    ],
    // Cancelled requests still reach the global handlers: React Router leaks
    // an AbortError when a navigation interrupts a `.data` response, and some
    // extensions wrap `fetch()` and rethrow aborts nobody catches.
    beforeSend: (event, hint) =>
      isNetworkError(hint.originalException) ||
      isAbortError(hint.originalException)
        ? null
        : event,
    integrations: (integrations) =>
      integrations.filter(({ name }) => name !== "BrowserSession")
  });
}

export function setMonitoringUser(userId: string | undefined) {
  Sentry.setUser(userId !== undefined ? { id: userId } : null);
}
