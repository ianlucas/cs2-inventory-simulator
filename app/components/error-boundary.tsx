/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faFrown } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Links, useNavigate, useRouteError } from "react-router";
import { SyncAction } from "~/data/sync";
import { pushToSync } from "~/sync";
import { isOurHostname } from "~/utils/misc";
import { confirm } from "./modal-generic";

export function ErrorBoundary() {
  const routeError = useRouteError();
  const error = routeError instanceof Error ? routeError : undefined;
  const navigate = useNavigate();

  async function handleRemoveAllItems() {
    if (
      await confirm({
        titleText: "Reset your inventory",
        bodyText: "Are you sure you want to reset your inventory?",
        cancelText: "Cancel",
        confirmText: "OK"
      })
    ) {
      pushToSync({ type: SyncAction.RemoveAllItems });
      return navigate("/");
    }
  }

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Links />
      </head>
      <body className="flex h-screen w-screen items-center justify-center bg-blue-500 font-mono text-white">
        <div className="lg:w-5xl">
          <FontAwesomeIcon icon={faFrown} className="h-16" />
          <h1 className="mt-4 text-lg font-bold">
            Inventory Simulator Application Error
          </h1>
          <p>
            An error has occurred.{" "}
            <a className="underline" href="/">
              Click here to refresh.
            </a>
          </p>
          <p className="mt-4">If this keeps happening:</p>
          <ul className="mt-2 list-disc pl-6">
            <li>
              Try to{" "}
              <a className="underline" href="#" onClick={handleRemoveAllItems}>
                reset your inventory.
              </a>
            </li>
            <li>
              {isOurHostname() ? (
                <a
                  className="underline"
                  href="https://github.com/ianlucas/cs2-inventory-simulator/issues"
                  target="_blank"
                >
                  Report the issue.
                </a>
              ) : (
                "Contact the application administrator."
              )}
            </li>
          </ul>
          {error?.stack !== undefined && (
            <pre className="relative mt-4 max-h-32 overflow-hidden text-sm text-ellipsis after:pointer-events-none after:absolute after:top-0 after:left-0 after:block after:size-full after:bg-linear-to-b after:from-transparent after:to-blue-500 after:content-['']">
              {error.stack}
            </pre>
          )}
        </div>
      </body>
    </html>
  );
}
