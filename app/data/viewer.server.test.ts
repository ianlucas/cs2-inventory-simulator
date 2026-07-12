/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/env.server", () => ({ VIEWER_EMBED_URL: undefined }));

const ruleState = vi.hoisted(() => ({
  enabled: true,
  callbackUrl: "http://localhost:3000/sign-in/steam/callback",
  key: ""
}));
vi.mock("~/models/rule.server", () => ({
  appEnable3dViewer: { get: async () => ruleState.enabled },
  steamCallbackUrl: { get: async () => ruleState.callbackUrl },
  app3dViewerKey: { get: async () => ruleState.key }
}));

// The caches are module-level (process-lifetime), so every test gets a fresh module = a cold cache.
async function loadModule() {
  vi.resetModules();
  return await import("./viewer.server");
}

function okJson(body: unknown) {
  return { ok: true, json: async () => body };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("resolveViewerCatalog", () => {
  it("cold resolve awaits the first fetch and returns the manifest", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async () => okJson({ maxId: 10, holes: [[2, 3]] }));
    vi.stubGlobal("fetch", fetchMock);
    const { resolveViewerCatalog } = await loadModule();
    expect(await resolveViewerCatalog()).toEqual({
      maxId: 10,
      holes: [[2, 3]]
    });
    // Warm now: served from cache, no second fetch.
    expect(await resolveViewerCatalog()).toEqual({
      maxId: 10,
      holes: [[2, 3]]
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("cold resolve fails closed after the bounded wait on a hung fetch, then recovers", async () => {
    vi.useFakeTimers();
    let settleFetch: ((value: unknown) => void) | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise((resolve) => {
            settleFetch = resolve;
          })
      )
    );
    const { resolveViewerCatalog } = await loadModule();
    const cold = resolveViewerCatalog();
    await vi.advanceTimersByTimeAsync(1500);
    expect(await cold).toBeUndefined();
    // The fetch was never abandoned: once it lands, the next resolve reads the cache.
    settleFetch?.(okJson({ maxId: 5, holes: [] }));
    await vi.advanceTimersByTimeAsync(0);
    expect(await resolveViewerCatalog()).toEqual({ maxId: 5, holes: [] });
  });

  it("caches a fail-closed verdict on fetch failure instead of re-awaiting every request", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async () => {
      throw new Error("down");
    });
    vi.stubGlobal("fetch", fetchMock);
    const { resolveViewerCatalog } = await loadModule();
    expect(await resolveViewerCatalog()).toBeUndefined();
    expect(await resolveViewerCatalog()).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("warmViewerCaches", () => {
  beforeEach(() => {
    ruleState.enabled = true;
    ruleState.callbackUrl = "http://localhost:3000/sign-in/steam/callback";
    ruleState.key = "";
  });

  it("does nothing when 3D is disabled", async () => {
    const fetchMock = vi.fn(async () => okJson({}));
    vi.stubGlobal("fetch", fetchMock);
    ruleState.enabled = false;
    const { warmViewerCaches } = await loadModule();
    await warmViewerCaches();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("warms the catalog and skips the peek for a trusted origin", async () => {
    const fetchMock = vi.fn(async (...args: unknown[]) => {
      expect(String(args[0])).toContain("/api/catalog");
      return okJson({ maxId: 5, holes: [] });
    });
    vi.stubGlobal("fetch", fetchMock);
    const { warmViewerCaches } = await loadModule();
    await warmViewerCaches();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("also warms the origin peek for a non-trusted origin", async () => {
    const fetchMock = vi.fn(async (input: unknown) =>
      String(input).includes("/api/catalog")
        ? okJson({ maxId: 5, holes: [] })
        : okJson({ limit: null, remaining: null })
    );
    vi.stubGlobal("fetch", fetchMock);
    ruleState.callbackUrl = "https://inventory.example.com/sign-in";
    const { warmViewerCaches } = await loadModule();
    await warmViewerCaches();
    const urls = fetchMock.mock.calls.map(([input]) => String(input));
    expect(urls.some((url) => url.includes("/api/catalog"))).toBe(true);
    expect(urls.some((url) => url.includes("/api/rate-limit"))).toBe(true);
  });
});
