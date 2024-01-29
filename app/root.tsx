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
  ScrollRestoration
} from "@remix-run/react";

import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { ClientOnly } from "remix-utils/client-only";
import { findRequestUser } from "./auth.server";
import { Background } from "./components/background";
import { Footer } from "./components/footer";
import { Header } from "./components/header";
import { Inventory } from "./components/inventory";
import { ItemSelectorProvider } from "./components/item-selector-context";
import { RootProvider } from "./components/root-context";
import { Splash } from "./components/splash";
import { SyncWarn } from "./components/sync-warn";
import {
  BUILD_LAST_COMMIT,
  MAX_INVENTORY_ITEMS,
  NAMETAG_DEFAULT_ALLOWED
} from "./env.server";
import { middleware } from "./http";
import { getBackground } from "./preferences/background.server";
import { getLanguage } from "./preferences/language.server";
import { getToggleable } from "./preferences/toggleable.server";
import { seoLinks, seoMeta } from "./seo";
import { getSession } from "./session.server";
import styles from "./tailwind.css";

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
  { rel: "stylesheet", href: styles },
  { rel: "manifest", href: "/app.webmanifest" },
  ...seoLinks
];

export async function loader({ request }: LoaderFunctionArgs) {
  await middleware(request);
  const session = await getSession(request.headers.get("Cookie"));
  const ipCountry = request.headers.get("CF-IPCountry");
  return typedjson({
    buildLastCommit: BUILD_LAST_COMMIT,
    maxInventoryItems: MAX_INVENTORY_ITEMS,
    nametagDefaultAllowed: NAMETAG_DEFAULT_ALLOWED,
    user: await findRequestUser(request),
    ...(await getBackground(session)),
    ...(await getLanguage(session, ipCountry)),
    ...(await getToggleable(session))
  });
}

export default function App() {
  const providerProps = useTypedLoaderData<typeof loader>();

  return (
    <RootProvider {...providerProps}>
      <html lang="en" onContextMenu={(event) => event.preventDefault()}>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <Meta />
          <Links />
          {seoMeta.map(({ name, content, property }, index) => (
            <meta
              key={index}
              name={name}
              content={content}
              property={property}
            />
          ))}
        </head>
        <body className="overflow-y-scroll bg-stone-800">
          <Splash />
          <div
            className="fixed left-0 top-0 -z-10 h-full w-full overflow-hidden lg:blur-sm"
            id="background"
          />
          <Background />
          <ClientOnly children={() => <SyncWarn />} />
          <Header />
          <ClientOnly
            children={() => (
              <ItemSelectorProvider>
                <Inventory />
              </ItemSelectorProvider>
            )}
          />
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
