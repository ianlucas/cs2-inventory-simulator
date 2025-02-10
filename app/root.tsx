/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type {
  LinksFunction,
  LoaderFunctionArgs,
  ShouldRevalidateFunctionArgs
} from "react-router";
import {
  data,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError
} from "react-router";

import { faFrown } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { findRequestUser } from "./auth.server";
import { AppProvider } from "./components/app-context";
import { Background } from "./components/background";
import { CloudflareAnalyticsScript } from "./components/cloudflare-analytics-script";
import { Console } from "./components/console";
import { Footer } from "./components/footer";
import { Header } from "./components/header";
import { Inventory } from "./components/inventory";
import { ItemSelectorProvider } from "./components/item-selector-context";
import { LocalizationScript } from "./components/localization-script";
import { Splash } from "./components/splash";
import { SyncIndicator } from "./components/sync-indicator";
import { SyncWarn } from "./components/sync-warn";
import {
  ASSETS_BASE_URL,
  BUILD_LAST_COMMIT,
  CLOUDFLARE_ANALYTICS_TOKEN
} from "./env.server";
import { middleware } from "./http.server";
import { getLocalizationChecksum } from "./localization.server";
import { getClientRules } from "./models/rule";
import { steamCallbackUrl } from "./models/rule.server";
import { getBackground } from "./preferences/background.server";
import { getLanguage } from "./preferences/language.server";
import { getToggleable } from "./preferences/toggleable.server";
import { getSeoLinks, getSeoMeta } from "./root-seo";
import { getSession } from "./session.server";
import styles from "./tailwind.css?url";
import { noempty } from "./utils/misc";

const bodyFontUrl =
  "https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wdth,wght@0,62.5..100,400..800;1,62.5..100,400..800&display=swap";

const displayFontUrl =
  "https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;600&display=swap";

// Please consider donating :-(
const displayFontIAmPayingFor = "https://use.typekit.net/ojo0ltc.css";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com" },
  { rel: "stylesheet", href: bodyFontUrl },
  { rel: "stylesheet", href: displayFontUrl },
  { rel: "stylesheet", href: displayFontIAmPayingFor },
  { rel: "stylesheet", href: styles },
  { rel: "manifest", href: "/app.webmanifest" }
];

export function shouldRevalidate({ currentUrl }: ShouldRevalidateFunctionArgs) {
  if (currentUrl.pathname === "/craft") {
    return false;
  }
  return true;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await middleware(request);
  const session = await getSession(request.headers.get("Cookie"));
  const user = await findRequestUser(request);
  const ipCountry = request.headers.get("CF-IPCountry");
  const { origin: appUrl, host: appSiteName } = new URL(
    await steamCallbackUrl.get()
  );
  return data({
    localization: {
      checksum: getLocalizationChecksum()
    },
    rules: {
      ...(await getClientRules(user?.id)),
      assetsBaseUrl: noempty(ASSETS_BASE_URL),
      buildLastCommit: BUILD_LAST_COMMIT,
      cloudflareAnalyticsToken: CLOUDFLARE_ANALYTICS_TOKEN,
      meta: { appUrl, appSiteName }
    },
    preferences: {
      ...(await getBackground(session)),
      ...(await getLanguage(session, ipCountry)),
      ...(await getToggleable(session))
    },
    user
  });
}

export default function App() {
  const appProps = useLoaderData<typeof loader>();

  return (
    <AppProvider {...appProps}>
      <html
        lang={appProps.preferences.lang}
        onContextMenu={(event) => event.preventDefault()}
      >
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <LocalizationScript />
          <Meta />
          <Links />
          <link
            rel="icon"
            href={appProps.rules.appFaviconUrl || "/favicon.ico"}
            type={appProps.rules.appFaviconMimeType || "image/x-icon"}
          />
          {getSeoLinks(appProps.rules).map((attributes, index) => (
            <link key={index} {...attributes} />
          ))}
          {getSeoMeta(appProps.rules).map((attributes, index) => (
            <meta key={index} {...attributes} />
          ))}
        </head>
        <body className="overflow-y-scroll bg-stone-800">
          <Splash />
          <Background />
          <Console />
          <SyncWarn />
          <ItemSelectorProvider>
            <Header />
            <Inventory />
          </ItemSelectorProvider>
          <Outlet />
          <Footer />
          <SyncIndicator />
          <ScrollRestoration />

          <CloudflareAnalyticsScript
            token={appProps.rules.cloudflareAnalyticsToken}
          />
          <Scripts />
        </body>
      </html>
    </AppProvider>
  );
}

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
