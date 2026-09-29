/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as Sentry from "@sentry/browser";
import { isbot } from "isbot";

export function initClientMonitoring() {
  const { sentryDsn: dsn, sentryEnvironment: environment } =
    document.documentElement.dataset;
  if (import.meta.env.DEV || dsn === undefined || isbot(navigator.userAgent)) {
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
      "Non-Error promise rejection captured"
    ],
    integrations: (integrations) =>
      integrations.filter(({ name }) => name !== "BrowserSession")
  });
}

export function setMonitoringUser(userId: string | undefined) {
  Sentry.setUser(userId !== undefined ? { id: userId } : null);
}
