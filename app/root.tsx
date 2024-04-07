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
import { TranslationScript } from "./components/translation-script";
import { BUILD_LAST_COMMIT } from "./env.server";
import { middleware } from "./http.server";
import { getRule, getRules } from "./models/rule.server";
import {
  getBackground,
  getCurrentBackground
} from "./preferences/background.server";
import { getLanguage } from "./preferences/language.server";
import { getToggleable } from "./preferences/toggleable.server";
import { getSeoLinks, getSeoMeta } from "./seo";
import { getSession } from "./session.server";
import styles from "./tailwind.css?url";
import { getTranslationChecksum } from "./translation.server";

const bodyFontUrl =
  "https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wdth,wght@0,62.5..100,400..800;1,62.5..100,400..800&display=swap";

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
  const user = await findRequestUser(request);
  const ipCountry = request.headers.get("CF-IPCountry");
  const { origin: appUrl, host: appSiteName } = new URL(
    await getRule("SteamCallbackUrl")
  );
  return typedjson({
    translations: {
      checksum: getTranslationChecksum()
    },
    rules: {
      ...(await getRules(
        [
          "CraftHideCategory",
          "CraftHideId",
          "CraftHideModel",
          "CraftHideType",
          "EditHideCategory",
          "EditHideId",
          "EditHideModel",
          "EditHideType",
          "InventoryItemAllowApplySticker",
          "InventoryItemAllowEdit",
          "InventoryItemAllowScrapeSticker",
          "InventoryMaxItems",
          "InventoryStorageUnitMaxItems"
        ],
        user?.id
      )),
      buildLastCommit: BUILD_LAST_COMMIT,
      meta: { appUrl, appSiteName }
    },
    preferences: {
      ...(await getBackground(session)),
      ...(await getCurrentBackground(session)),
      ...(await getLanguage(session, ipCountry)),
      ...(await getToggleable(session))
    },
    user
  });
}

export default function App() {
  const providerProps = useTypedLoaderData<typeof loader>();
  const { meta } = providerProps.rules;

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
          <ItemSelectorProvider>
            <Header />
            <Inventory />
          </ItemSelectorProvider>
          <Outlet />
          <Footer />
          <SyncIndicator />
          <ScrollRestoration />
          <TranslationScript />
          <Scripts />
        </body>
      </html>
    </RootProvider>
  );
}
