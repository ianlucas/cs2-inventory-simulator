/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as Sentry from "@sentry/node";
import { SENTRY_DSN, SENTRY_ENVIRONMENT, SOURCE_COMMIT } from "./env.server";
import { nonEmptyString } from "./shared/misc";

export function initServerMonitoring() {
  const dsn = nonEmptyString(SENTRY_DSN);
  if (import.meta.env.DEV || dsn === undefined) {
    return;
  }
  Sentry.init({
    dsn,
    environment: SENTRY_ENVIRONMENT,
    release: nonEmptyString(SOURCE_COMMIT),
    registerEsmLoaderHooks: false,
    tracePropagationTargets: [],
    integrations: (integrations) => [
      ...integrations.filter(({ name }) => name !== "ProcessSession"),
      Sentry.httpIntegration({
        spans: false,
        trackIncomingRequestsAsSessions: false
      }),
      Sentry.onUnhandledRejectionIntegration({ mode: "strict" })
    ],
    beforeSend: scrubEvent,
    beforeBreadcrumb: scrubBreadcrumb
  });
}

function scrubEvent(event: Sentry.ErrorEvent) {
  const { request } = event;
  if (request !== undefined) {
    const userAgent = request.headers?.["user-agent"];
    event.request = {
      headers: userAgent !== undefined ? { "user-agent": userAgent } : {},
      method: request.method,
      url: request.url !== undefined ? stripQuery(request.url) : undefined
    };
  }
  return event;
}

function scrubBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
  const { data } = breadcrumb;
  if (data !== undefined) {
    delete data["http.query"];
    delete data["http.fragment"];
    if (typeof data.url === "string") {
      data.url = stripQuery(data.url);
    }
  }
  return breadcrumb;
}

function stripQuery(url: string) {
  return url.split(/[?#]/)[0];
}

export function setMonitoringUser(userId: string) {
  Sentry.setUser({ id: userId });
}
