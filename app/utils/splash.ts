/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

interface Window {
  __splashInit: boolean;
  __splashN: number;
  __splashLoaded: boolean;
  __splashRender: () => void;
  __splashEnd: () => void;
}

if (!window.__splashInit) {
  window.__splashInit = true;
  window.__splashN = 0;
  window.__splashLoaded = document.readyState === "complete";

  window.addEventListener("load", () => {
    window.__splashLoaded = true;
  });

  window.__splashRender = () => {
    const splash = document.getElementById("splash");
    const progress = document.getElementById("splash-progress");
    if (
      splash === null ||
      progress === null ||
      splash.style.display === "none"
    ) {
      return;
    }
    if (window.__splashLoaded) {
      window.__splashN = 1;
    } else {
      const thresholds = [0.2, 0.5, 0.8, 0.99];
      const amounts = [0.1, 0.04, 0.02, 0.005];
      const amount =
        amounts.find((a, i) => window.__splashN < thresholds[i]) || 0;
      window.__splashN = Math.min(window.__splashN + amount, 0.994);
    }
    if (window.__splashN >= 1) {
      setTimeout(window.__splashEnd, 1000);
    } else {
      progress.style.width = window.__splashN * 100 + "%";
      setTimeout(window.__splashRender, 500);
    }
  };

  window.__splashEnd = () => {
    const splash = document.getElementById("splash");
    const progress = document.getElementById("splash-progress");
    if (splash === null || progress === null) {
      return;
    }
    progress.style.width = window.__splashN * 100 + "%";
    splash.style.opacity = "0";
    splash.style.pointerEvents = "none";
    setTimeout(() => (splash.style.display = "none"), 1000);
  };

  window.__splashRender();

  window.onerror = () => {
    window.__splashRender();
  };
}
