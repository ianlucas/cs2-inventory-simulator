/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration
} from "@remix-run/react";

import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { findRequestUser } from "./auth.server";
import { Background } from "./components/background";
import { Footer } from "./components/footer";
import { Header } from "./components/header";
import { Inventory } from "./components/inventory";
import { ItemSelectorProvider } from "./components/item-selector-context";
import { RootProvider } from "./components/root-context";
import { Splash } from "./components/splash";
import { SyncIndicator } from "./components/sync-indicator";
import { SyncWarn } from "./components/sync-warn";
import { BUILD_LAST_COMMIT } from "./env.server";
import { middleware } from "./http.server";
import { getRule } from "./models/rule.server";
import { getBackground } from "./preferences/background.server";
import { getLanguage } from "./preferences/language.server";
import { getToggleable } from "./preferences/toggleable.server";
import { getSeoLinks, getSeoMeta } from "./seo";
import { getSession } from "./session.server";
import styles from "./tailwind.css?url";

const bodyFontUrl =
  "https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,800;1,700&display=swap";

const displayFontUrl =
  "https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;600&display=swap";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com" },
  { rel: "stylesheet", href: bodyFontUrl },
  { rel: "stylesheet", href: displayFontUrl },
  { rel: "stylesheet", href: styles },
  { rel: "manifest", href: "/app.webmanifest" }
];

export async function loader({ request }: LoaderFunctionArgs) {
  await middleware(request);
  const session = await getSession(request.headers.get("Cookie"));
  const ipCountry = request.headers.get("CF-IPCountry");
  const { origin: appUrl, host: appSiteName } = new URL(
    await getRule("SteamCallbackUrl")
  );
  return typedjson({
    env: {
      meta: { appUrl, appSiteName },
      buildLastCommit: BUILD_LAST_COMMIT,
      inventoryMaxItems: await getRule("InventoryMaxItems"),
      inventoryStorageUnitMaxItems: await getRule(
        "InventoryStorageUnitMaxItems"
      )
    },
    preferences: {
      ...(await getBackground(session)),
      ...(await getLanguage(session, ipCountry)),
      ...(await getToggleable(session))
    },
    user: await findRequestUser(request)
  });
}

export default function App() {
  const providerProps = useTypedLoaderData<typeof loader>();
  const { meta } = providerProps.env;

  return (
    <RootProvider {...providerProps}>
      <html
        lang={providerProps.preferences.lang}
        onContextMenu={(event) => event.preventDefault()}
      >
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <Meta />
          <Links />
          {getSeoLinks(meta).map((attributes, index) => (
            <link key={index} {...attributes} />
          ))}
          {getSeoMeta(meta).map((attributes, index) => (
            <meta key={index} {...attributes} />
          ))}
        </head>
        <body className="overflow-y-scroll bg-stone-800">
          <Splash />
          <Background />
          <SyncWarn />
          <Header />
          <ItemSelectorProvider>
            <Inventory />
          </ItemSelectorProvider>
          <Outlet />
          <Footer />
          <SyncIndicator />
          <ScrollRestoration />
          <Scripts />
        </body>
      </html>
    </RootProvider>
  );
}
