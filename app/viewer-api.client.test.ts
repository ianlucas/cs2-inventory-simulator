/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, CS2ItemType, CS2RarityColor } from "@ianlucas/cs2-lib";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildViewerSrc, VIEWER_AGENT_IDLE_CLIP } from "./viewer";
import { VIEWER_LOG_LIMIT, ViewerApi } from "./viewer-api.client";

CS2Economy.load({
  items: [
    { id: 5, type: CS2ItemType.Weapon, rarityColor: CS2RarityColor.Common },
    { id: 80, type: CS2ItemType.Agent, rarityColor: CS2RarityColor.Common }
  ]
});

const apis: ViewerApi[] = [];

function attach(options?: Parameters<typeof buildViewerSrc>[1]) {
  const iframe = document.createElement("iframe");
  iframe.src = buildViewerSrc({ id: 5 }, options);
  const api = new ViewerApi(iframe);
  apis.push(api);
  return api;
}

/** A viewer the page can reach, as a cross-origin iframe that has loaded. */
function attachReachable() {
  const iframe = document.createElement("iframe");
  iframe.src = buildViewerSrc({ id: 5 });
  const contentWindow = {
    get location(): never {
      throw new DOMException("Blocked a cross-origin frame.", "SecurityError");
    },
    postMessage() {}
  };
  Object.defineProperty(iframe, "contentWindow", { value: contentWindow });
  const api = new ViewerApi(iframe);
  apis.push(api);
  const receive = (type: string, data?: unknown) =>
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { data, source: "3d.cstrike.app", type, v: 1 },
        origin: api.origin,
        source: contentWindow as unknown as Window
      })
    );
  return { api, iframe, receive };
}

afterEach(() => {
  apis.splice(0).forEach((api) => api.destroy());
  vi.useRealTimers();
});

describe("ViewerApi.setItem", () => {
  it("sends an agent with its idle", () => {
    const api = attach();
    api.setItem({ id: 80 });
    expect(api.item).toEqual({ id: 80, clip: VIEWER_AGENT_IDLE_CLIP });
  });

  it("sends an agent still to an icon or capture viewer", () => {
    for (const options of [{ icon: true }, { capture: true }]) {
      const api = attach(options);
      api.setItem({ id: 80 });
      expect(api.item).toEqual({ id: 80 });
    }
  });
});

describe("ViewerApi.describeSince", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("tells a fresh viewer by how long it took to be ready, then the traffic since with each message's plain fields", () => {
    const { api, receive } = attachReachable();
    vi.advanceTimersByTime(1_900);
    receive("ready", { v: 1 });
    const mark = api.markLog();
    void api.capture({ id: 5 }).catch(() => {});
    vi.advanceTimersByTime(100);
    receive("loading", { busy: true });
    receive("rateLimited", { retryAfterMs: 5500, scope: "ip" });
    receive("rendered", { item: { id: 5 } });
    receive("captured", { apiCalls: 1, error: "encode", item: { id: 5 } });

    expect(api.describeSince(mark)).toBe(
      [
        "fresh (ready in 1.9s)",
        "+0.0s → capture",
        "+0.1s ← loading busy=true",
        "+0.1s ← rateLimited retryAfterMs=5500 scope=ip",
        "+0.1s ← rendered",
        "+0.1s ← captured apiCalls=1 error=encode"
      ].join(" · ")
    );
  });

  it("tells a warm viewer by how long it has been up and how much it captured", () => {
    const { api, receive } = attachReachable();
    receive("ready", { v: 1 });
    void api.capture({ id: 5 }).catch(() => {});
    void api.capture({ id: 5 }).catch(() => {});
    vi.advanceTimersByTime(30_000);
    const mark = api.markLog();
    void api.capture({ id: 5 }).catch(() => {});

    expect(api.describeSince(mark)).toBe(
      "warm (up 30.0s, captured 2 before) · +0.0s → capture"
    );
  });

  it("tells a command that never reached the viewer", () => {
    const api = attach();
    const mark = api.markLog();
    api.ping();

    expect(api.describeSince(mark)).toBe(
      "fresh (not ready) · +0.0s → ping (undelivered)"
    );
  });

  it("tells the iframe's first page load from a later one", () => {
    const { api, iframe } = attachReachable();
    const mark = api.markLog();
    iframe.dispatchEvent(new Event("load"));
    iframe.dispatchEvent(new Event("load"));

    expect(api.describeSince(mark)).toBe(
      "fresh (not ready) · +0.0s load · +0.0s → ping · +0.0s reload · +0.0s → ping"
    );
  });

  it("tells a reply that never came, and how late the page noticed", async () => {
    const { api, receive } = attachReachable();
    receive("ready", { v: 1 });
    const mark = api.markLog();
    const state = api.getState(1_000);
    // A page too busy to run its timers sees the clock move on without them.
    vi.setSystemTime(Date.now() + 3_000);
    vi.advanceTimersByTime(1_000);

    await expect(state).rejects.toThrow("ViewerApi: getState timed out.");
    expect(api.describeSince(mark)).toBe(
      "fresh (ready in 0.0s) · +0.0s → getState · +4.0s getState timed out (3000ms late)"
    );
  });

  it("keeps only the latest traffic", () => {
    const { api, receive } = attachReachable();
    const mark = api.markLog();
    for (let index = 0; index <= VIEWER_LOG_LIMIT; index++) {
      receive("captureReady", { index });
    }

    const [, ...traffic] = api.describeSince(mark).split(" · ");
    expect(traffic).toHaveLength(VIEWER_LOG_LIMIT);
    expect(traffic[0]).toBe("+0.0s ← captureReady index=1");
  });
});
