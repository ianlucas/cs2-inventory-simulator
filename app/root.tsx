/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation
} from "@remix-run/react";

import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { ClientOnly } from "remix-utils/client-only";
import { findRequestUser } from "./auth.server";
import { Background } from "./components/background";
import { Footer } from "./components/footer";
import { Header } from "./components/header";
import { Inventory } from "./components/inventory";
import { RootProvider } from "./components/root-context";
import { SyncWarn } from "./components/sync-warn";
import { MAX_INVENTORY_ITEMS } from "./env.server";
import styles from "./tailwind.css";
import { getTranslations } from "./translations.server";

const bodyFontUrl =
  "https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,800;1,700&display=swap";

const displayFontUrl =
  "https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;600&display=swap";

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com" },
  { rel: "stylesheet", href: bodyFontUrl },
  { rel: "stylesheet", href: displayFontUrl },
  { rel: "stylesheet", href: styles }
];

export async function loader({ request }: LoaderFunctionArgs) {
  return typedjson({
    user: await findRequestUser(request),
    maxInventoryItems: MAX_INVENTORY_ITEMS,
    ...(await getTranslations(request))
  });
}

export default function App() {
  const location = useLocation();
  const providerProps = useTypedLoaderData<typeof loader>();
  const showInventory = location.pathname !== "/api";

  return (
    <RootProvider {...providerProps}>
      <html
        lang="en"
        onContextMenu={(event) => event.preventDefault()}
        className="[scrollbar-gutter:stable]"
      >
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <Meta />
          <Links />
        </head>
        <body className="overflow-y-scroll bg-stone-800">
          <div
            className="fixed left-0 top-0 -z-10 h-full w-full overflow-hidden lg:blur-lg"
            id="background"
          />
          <Background />
          {showInventory && <ClientOnly>{() => <SyncWarn />}</ClientOnly>}
          <Header />
          {showInventory && <ClientOnly>{() => <Inventory />}</ClientOnly>}
          <Outlet />
          <Footer />
          <ScrollRestoration />
          <Scripts />
          <LiveReload />
        </body>
      </html>
    </RootProvider>
  );
}
