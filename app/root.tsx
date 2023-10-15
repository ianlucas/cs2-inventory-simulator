import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction } from "@remix-run/node";
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";

import { Background } from "./components/background";
import { Header } from "./components/header";
import { Inventory } from "./components/inventory";
import { RootProvider } from "./components/root-context";
import styles from "./tailwind.css";

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
  { rel: "stylesheet", href: styles }
];

export default function App() {
  return (
    <RootProvider>
      <html lang="en" onContextMenu={event => event.preventDefault()}>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <Meta />
          <Links />
        </head>
        <body className="bg-stone-800">
          <Background />
          <Header />
          <Inventory />
          <Outlet />
          <ScrollRestoration />
          <Scripts />
          <LiveReload />
        </body>
      </html>
    </RootProvider>
  );
}
