/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Logo } from "./logo";

export function Splash() {
  return (
    <div
      id="splash"
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
        style={{
          border: "1px solid #fff",
          borderRadius: "4px",
          filter: "drop-shadow(0 0 0.5rem rgba(0, 0, 0, 0.5))"
        }}
      >
        <div style={{ padding: "0 0.5em 0 0.5em" }}>
          <Logo />
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
      <script
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `const splash = document.getElementById("splash");
const progress = document.getElementById("splash-progress");
let n = 0;
let loaded = false;

if (document.readyState === 'complete') {
  loaded = true;
} else {
  window.addEventListener('load', () => {
    loaded = true;
  });
}

function render() {
  if (loaded) {
    n = 1;
  } else {
    let amount = 0;
    if (n >= 0 && n < 0.2) { amount = 0.1; }
    else if (n >= 0.2 && n < 0.5) { amount = 0.04; }
    else if (n >= 0.5 && n < 0.8) { amount = 0.02; }
    else if (n >= 0.8 && n < 0.99) { amount = 0.005; }
    n = Math.min(n + amount, 0.994);
  }
  progress.style.width = n * 100 + "%";
  if (n >= 1) {
    clearInterval(render);
    splash.style.opacity = 0;
    splash.style.pointerEvents = "none";
    setTimeout(() => splash.display = "none", 1000);
  }
}

setInterval(render, 500);`
        }}
      />
    </div>
  );
}
