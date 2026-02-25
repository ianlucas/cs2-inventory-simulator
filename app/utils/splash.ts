/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const splash = {
  n: 0,
  loaded: document.readyState === "complete",

  render() {
    const splash = document.getElementById("splash");
    const progress = document.getElementById("splash-progress");
    if (
      splash === null ||
      progress === null ||
      splash.style.display === "none"
    ) {
      return;
    }
    if (this.loaded) {
      this.n = 1;
    } else {
      const thresholds = [0.2, 0.5, 0.8, 0.99];
      const amounts = [0.1, 0.04, 0.02, 0.005];
      const amount = amounts.find((a, i) => this.n < thresholds[i]) || 0;
      this.n = Math.min(this.n + amount, 0.994);
    }
    if (this.n >= 1) {
      setTimeout(() => this.end(), 1000);
    } else {
      progress.style.width = this.n * 100 + "%";
      setTimeout(() => this.render(), 500);
    }
  },

  end() {
    const splash = document.getElementById("splash");
    const progress = document.getElementById("splash-progress");
    if (splash === null || progress === null) {
      return;
    }
    progress.style.width = this.n * 100 + "%";
    splash.style.opacity = "0";
    splash.style.pointerEvents = "none";
    setTimeout(() => (splash.style.display = "none"), 1000);
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
window.InventorySimulator ??= {} as any;
if (window.InventorySimulator.splash === undefined) {
  window.InventorySimulator.splash = splash;
  splash.render();

  window.addEventListener("load", () => {
    splash.loaded = true;
  });

  window.onerror = () => {
    splash.render();
  };
}
