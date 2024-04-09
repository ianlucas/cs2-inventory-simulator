/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Logo } from "./logo";
import { useRootContext } from "./root-context";

export function Splash() {
  const {
    translations: { translate }
  } = useRootContext();

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
            <strong>{translate("JavaScriptRequired")}</strong>
          </div>
        </noscript>
      </div>
      <style
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `:root {
  color-scheme: dark;
}`
        }}
      />
      <script
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `if (!window.$splashInit) {
  window.$splashInit = true;
  window.$splashN = 0;
  window.$splashLoaded = document.readyState === 'complete';

  window.addEventListener('load', () => {
    window.$splashLoaded = true;
  });

  window.$splashRender = function () {
    const splash = document.getElementById('splash');
    const progress = document.getElementById('splash-progress');
    if (splash.display === 'none') {
      return;
    }
    if (window.$splashLoaded) {
      window.$splashN = 1;
    } else {
      const thresholds = [0.2, 0.5, 0.8, 0.99];
      const amounts = [0.1, 0.04, 0.02, 0.005];
      const amount =
        amounts.find((a, i) => window.$splashN < thresholds[i]) || 0;
      window.$splashN = Math.min(window.$splashN + amount, 0.994);
    }
    if (window.$splashN >= 1) {
      setTimeout(window.$splashEnd, 1000);
    } else {
      progress.style.width = window.$splashN * 100 + '%';
      setTimeout(window.$splashRender, 500);
    }
  };

  window.$splashEnd = function () {
    const splash = document.getElementById('splash');
    const progress = document.getElementById('splash-progress');
    progress.style.width = window.$splashN * 100 + '%';
    splash.style.opacity = 0;
    splash.style.pointerEvents = 'none';
    setTimeout(() => (splash.display = 'none'), 1000);
  };

  window.$splashRender();

  window.onerror = () => {
    window.$splashRender();
  };
}`
        }}
      />
    </div>
  );
}
