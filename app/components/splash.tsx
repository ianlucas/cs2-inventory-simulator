/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useLocalize } from "./app-context";
import { Logo } from "./logo";

export function Splash() {
  const localize = useLocalize();
  return (
    <div
      id="splash"
      suppressHydrationWarning
      style={{
        alignItems: "center",
        backgroundColor: "#121212",
        color: "white",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        left: 0,
        position: "fixed",
        top: 0,
        transition: "opacity 1s ease-in-out",
        width: "100%",
        zIndex: 100
      }}
    >
      <div
        suppressHydrationWarning
        style={{
          border: "1px solid #fff",
          borderRadius: "4px",
          minWidth: "216.859px",
          minHeight: "44px"
        }}
      >
        <div
          suppressHydrationWarning
          style={{ padding: "0.25em 0.5em 0 0.5em" }}
        >
          <Logo className="h-8" />
        </div>
        <div style={{ padding: "2px" }}>
          <div
            suppressHydrationWarning
            id="splash-progress"
            style={{
              background: "white",
              borderRadius: "2px",
              height: "4px",
              transition: "width 500ms ease-in-out",
              width: "0%"
            }}
          />
        </div>
        <noscript>
          <div className="px-2 pb-1 text-center">
            <strong>{localize("JavaScriptRequired")}</strong>
          </div>
        </noscript>
      </div>
      <style
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `:root {color-scheme: dark;}`
        }}
      />
      <script
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: __SPLASH_SCRIPT__
        }}
      />
    </div>
  );
}
