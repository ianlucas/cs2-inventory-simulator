/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { PassThrough } from "node:stream";

import { CS2_ITEMS, CS2Economy } from "@ianlucas/cs2-lib";
import { english } from "@ianlucas/cs2-lib/translations";
import { createReadableStreamFromReadable } from "@react-router/node";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import type { EntryContext, HandleErrorFunction } from "react-router";
import { isRouteErrorResponse, ServerRouter } from "react-router";
import { viewerServerAvailability } from "./viewer-server-availability.server";
import { setupLogo } from "./logo.server";
import { setupRules } from "./models/rule";
import { scheduleEconomyPrices } from "./routines/economy-price";
import { scheduleInventoryProjection } from "./routines/inventory-projection";
import { scheduleInactivityReset } from "./routines/reset-inactive-inventory";
import { setupPurge } from "./routines/setup-purge";
import { logError } from "./shared/monitoring";
import { setupTranslation } from "./translation.server";

const ABORT_DELAY = 5_000;

CS2Economy.load({ items: CS2_ITEMS, language: english });
setupTranslation();
void setupPurge();
scheduleInactivityReset();
scheduleEconomyPrices();
scheduleInventoryProjection();
void setupRules().then(() => {
  void setupLogo();
  viewerServerAvailability.start();
});

export const handleError: HandleErrorFunction = (error, { request }) => {
  if (request.signal.aborted || isRouteErrorResponse(error)) {
    return;
  }
  logError("Request failed.", { error });
};

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext
) {
  return isbot(request.headers.get("user-agent"))
    ? handleBotRequest(
        request,
        responseStatusCode,
        responseHeaders,
        reactRouterContext
      )
    : handleBrowserRequest(
        request,
        responseStatusCode,
        responseHeaders,
        reactRouterContext
      );
}

function handleBotRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={reactRouterContext} url={request.url} />,
      {
        onAllReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            logError("Streaming render failed.", { error });
          }
        }
      }
    );

    setTimeout(abort, ABORT_DELAY);
  });
}

function handleBrowserRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={reactRouterContext} url={request.url} />,
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            logError("Streaming render failed.", { error });
          }
        }
      }
    );

    setTimeout(abort, ABORT_DELAY);
  });
}
