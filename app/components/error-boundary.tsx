/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faFrown } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Links, useRouteError } from "react-router";

export function ErrorBoundary() {
  const routeError = useRouteError();
  const error = routeError instanceof Error ? routeError : undefined;
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Links />
      </head>
      <body className="flex h-screen w-screen items-center justify-center bg-blue-500 font-mono text-white">
        <div className="lg:w-[1024px]">
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
          {error?.stack !== undefined && (
            <pre className="relative mt-4 max-h-[128px] overflow-hidden text-sm text-ellipsis after:pointer-events-none after:absolute after:top-0 after:left-0 after:block after:h-full after:w-full after:bg-linear-to-b after:from-transparent after:to-blue-500 after:content-['']">
              {error.stack}
            </pre>
          )}
        </div>
      </body>
    </html>
  );
}
