/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Logo } from "./logo";

export function Splash() {
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
          __html: `if (!window.g_SplashInitialized) {
  window.g_SplashInitialized = true;
  window.g_SplashN = 0;
  window.g_SplashLoaded = false;
  window.g_SplashErrors = [];

  if (document.readyState === 'complete') {
    window.g_SplashLoaded = true;
  } else {
    window.addEventListener('load', () => {
      window.g_SplashLoaded = true;
    });
  }

  window.g_SplashRender = function () {
    const splash = document.getElementById("splash");
    const progress = document.getElementById("splash-progress");
    if (splash.display === "none") {
      return;
    }
    if (window.g_SplashLoaded) {
      window.g_SplashN = 1;
    } else {
      let amount = 0;
      if (window.g_SplashN >= 0 && window.g_SplashN < 0.2) { amount = 0.1; }
      else if (window.g_SplashN >= 0.2 && window.g_SplashN < 0.5) { amount = 0.04; }
      else if (window.g_SplashN >= 0.5 && window.g_SplashN < 0.8) { amount = 0.02; }
      else if (window.g_SplashN >= 0.8 && window.g_SplashN < 0.99) { amount = 0.005; }
      window.g_SplashN = Math.min(window.g_SplashN + amount, 0.994);
    }
    if (window.g_SplashN >= 1) {
      setTimeout(window.g_SplashEnd, 1000);
    } else {
      progress.style.width = window.g_SplashN * 100 + "%";
      setTimeout(window.g_SplashRender, 500);
    }
  }

  window.g_SplashEnd = function () {
    const splash = document.getElementById("splash");
    const progress = document.getElementById("splash-progress");
    progress.style.width = window.g_SplashN * 100 + "%";
    splash.style.opacity = 0;
    splash.style.pointerEvents = "none";
    setTimeout(() => splash.display = "none", 1000);
  }

  window.g_SplashRender();
}

window.onerror = (event, source, lineno, colno, error) => {
  window.g_SplashRender();
};`
        }}
      />
    </div>
  );
}
