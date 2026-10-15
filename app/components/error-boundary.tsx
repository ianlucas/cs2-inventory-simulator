/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faFrown } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MouseEvent } from "react";
import {
  Links,
  Scripts,
  useRouteError,
  useRouteLoaderData
} from "react-router";
import { ClientOnly } from "remix-utils/client-only";
import { errorBoundaryEnglish } from "~/data/error-boundary-english";
import { clientGlobals, isServerContext, serverGlobals } from "~/globals";
import type { loader as rootLoader } from "~/root";
import { ApiActionResetInventoryUrl } from "~/routes/api.action.reset-inventory._index";
import { isNetworkError } from "~/shared/fetch";
import { isOurHostname } from "~/shared/misc";
import { confirm } from "./modal-generic";

export function ErrorBoundary() {
  const routeError = useRouteError();
  const error = routeError instanceof Error ? routeError : undefined;
  // Kept from the last successful load when a client navigation fails.
  const rootData = useRouteLoaderData<typeof rootLoader>("root");
  const preferences = rootData?.preferences;
  const translationMap = isServerContext
    ? preferences !== undefined
      ? serverGlobals.systemTranslationByLanguage[preferences.language]
      : undefined
    : clientGlobals.systemTranslationMap;

  function translate(token: keyof typeof errorBoundaryEnglish) {
    return translationMap?.[token] ?? errorBoundaryEnglish[token];
  }

  function handleRetry(event: MouseEvent) {
    event.preventDefault();
    window.location.reload();
  }

  async function handleRemoveAllItems(event: MouseEvent) {
    event.preventDefault();
    if (
      await confirm({
        titleText: translate("SettingsRemoveAllItems"),
        bodyText: [
          translate("SettingsConfirmRemoveAllItems"),
          translate("LoadoutResetInventoryDesc")
        ].join("\n"),
        cancelText: translate("GenericCancel"),
        confirmText: translate("GenericOK")
      })
    ) {
      try {
        await fetch(ApiActionResetInventoryUrl, { method: "POST" });
      } finally {
        window.location.assign("/");
      }
    }
  }

  return (
    <html
      data-item-language={
        preferences !== undefined
          ? (preferences.itemLanguage ?? preferences.language)
          : undefined
      }
      data-language={preferences?.language}
      data-sentry-dsn={rootData?.rules.sentryClientDsn}
      data-sentry-environment={rootData?.rules.sentryEnvironment}
      lang={preferences?.lang}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Links />
      </head>
      <body className="flex h-screen w-screen items-center justify-center bg-blue-500 font-mono text-white">
        <div className="lg:w-5xl">
          <FontAwesomeIcon icon={faFrown} className="h-16" />
          {isNetworkError(routeError) ? (
            <>
              <h1 className="mt-4 text-lg font-bold">
                {translate("ErrorBoundaryConnectionTitle")}
              </h1>
              <p>{translate("ErrorBoundaryConnectionDesc")}</p>
              <p className="mt-4">
                <a className="underline" href="#" onClick={handleRetry}>
                  {translate("ErrorBoundaryConnectionRetry")}
                </a>
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-4 text-lg font-bold">
                {translate("ErrorBoundaryTitle")}
              </h1>
              <p>
                {translate("ErrorBoundaryDesc")}{" "}
                <a className="underline" href="/">
                  {translate("ErrorBoundaryRefresh")}
                </a>
              </p>
              <p className="mt-4">{translate("ErrorBoundaryKeepsHappening")}</p>
              <ul className="mt-2 list-disc pl-6">
                <li>
                  <a
                    className="underline"
                    href="#"
                    onClick={handleRemoveAllItems}
                  >
                    {translate("ErrorBoundaryResetInventory")}
                  </a>
                </li>
                <ClientOnly
                  children={() => (
                    <li>
                      {isOurHostname() ? (
                        <a
                          className="underline"
                          href="https://github.com/ianlucas/cs2-inventory-simulator/issues"
                          target="_blank"
                        >
                          {translate("ErrorBoundaryReportIssue")}
                        </a>
                      ) : (
                        translate("ErrorBoundaryContactAdmin")
                      )}
                    </li>
                  )}
                />
              </ul>
              {error?.stack !== undefined && (
                <pre className="relative mt-4 max-h-32 overflow-hidden text-sm text-ellipsis after:pointer-events-none after:absolute after:top-0 after:left-0 after:block after:size-full after:bg-linear-to-b after:from-transparent after:to-blue-500 after:content-['']">
                  {error.stack}
                </pre>
              )}
            </>
          )}
        </div>
        <Scripts />
      </body>
    </html>
  );
}
