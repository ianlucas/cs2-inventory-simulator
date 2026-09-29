/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/env.server", () => ({ VIEWER_EMBED_URL: undefined }));

vi.mock("~/singleton.server", () => ({
  singleton: (_name: string, factory: () => unknown) => factory()
}));

const ruleState = vi.hoisted(() => ({
  enabled: true,
  callbackUrl: "https://inventory.example.com/sign-in/steam/callback",
  key: ""
}));
vi.mock("~/models/rule.server", () => ({
  viewerEnabled: { isTrueForAnyone: async () => ruleState.enabled },
  steamCallbackUrl: { get: async () => ruleState.callbackUrl },
  viewerKey: { get: async () => ruleState.key }
}));

import {
  VIEWER_CATALOG_REFRESH_MS,
  VIEWER_CATALOG_RETRY_MS,
  VIEWER_RATE_LIMIT_REFRESH_MS,
  VIEWER_RATE_LIMIT_RETRY_MS,
  ViewerServerAvailability
} from "./viewer.server";

const CATALOG = { maxId: 10, holes: [[2, 3]] };

type Reply = {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
};

function reply({ status = 200, body, headers = {} }: Reply) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: async () => body
  };
}

// Routes fetches by endpoint; each handler may be swapped mid-test.
function stubViewer(handlers: {
  catalog?: () => Reply | Promise<Reply>;
  rateLimit?: () => Reply | Promise<Reply>;
}) {
  const fetchMock = vi.fn(async (input: unknown) => {
    const url = String(input);
    const handler = url.endsWith("/api/catalog")
      ? handlers.catalog
      : url.endsWith("/api/rate-limit")
        ? handlers.rateLimit
        : undefined;
    if (handler === undefined) {
      throw new Error(`unexpected fetch ${url}`);
    }
    return reply(await handler());
  });
  vi.stubGlobal("fetch", fetchMock);
  return {
    fetchMock,
    calls: (endpoint: string) =>
      fetchMock.mock.calls.filter(([input]) => String(input).endsWith(endpoint))
        .length
  };
}

const healthyQuota = () => ({
  body: { limit: 1000, remaining: 900, resetAt: null }
});

async function settle(ms = 0) {
  await vi.advanceTimersByTimeAsync(ms);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  ruleState.enabled = true;
  ruleState.callbackUrl =
    "https://inventory.example.com/sign-in/steam/callback";
  ruleState.key = "";
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("ViewerServerAvailability", () => {
  it("reports disabled without starting the loops", async () => {
    const { fetchMock } = stubViewer({});
    const availability = new ViewerServerAvailability();
    expect(availability.getStatus(false)).toEqual({
      available: false,
      reason: "disabled"
    });
    await settle();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed as pending until both loops answer, then ships the catalog", async () => {
    stubViewer({ catalog: () => ({ body: CATALOG }), rateLimit: healthyQuota });
    const availability = new ViewerServerAvailability();
    expect(availability.getStatus(true)).toEqual({
      available: false,
      reason: "pending"
    });
    await settle();
    expect(availability.getStatus(true)).toEqual({
      available: true,
      catalog: CATALOG
    });
  });

  it("skips the rate limit check with a partner key", async () => {
    ruleState.key = "partner";
    const { calls } = stubViewer({ catalog: () => ({ body: CATALOG }) });
    const availability = new ViewerServerAvailability();
    availability.start();
    await settle();
    expect(availability.getStatus(true).available).toBe(true);
    expect(calls("/api/rate-limit")).toBe(0);
  });

  it("skips the rate limit check on a trusted hostname", async () => {
    ruleState.callbackUrl = "https://inventory.cstrike.app/sign-in";
    const { calls } = stubViewer({ catalog: () => ({ body: CATALOG }) });
    const availability = new ViewerServerAvailability();
    availability.start();
    await settle();
    expect(availability.getStatus(true).available).toBe(true);
    expect(calls("/api/rate-limit")).toBe(0);
  });

  it("refreshes the catalog on its own cycle", async () => {
    const { calls } = stubViewer({
      catalog: () => ({ body: CATALOG }),
      rateLimit: healthyQuota
    });
    const availability = new ViewerServerAvailability();
    availability.start();
    await settle();
    expect(calls("/api/catalog")).toBe(1);
    await settle(VIEWER_CATALOG_REFRESH_MS);
    expect(calls("/api/catalog")).toBe(2);
  });

  it("reports catalog-failed and retries on the shorter cycle", async () => {
    let catalog: () => Reply = () => ({ status: 503 });
    const { calls } = stubViewer({
      catalog: () => catalog(),
      rateLimit: healthyQuota
    });
    const availability = new ViewerServerAvailability();
    availability.start();
    await settle();
    expect(availability.getStatus(true)).toEqual({
      available: false,
      reason: "catalog-failed"
    });
    catalog = () => ({ body: CATALOG });
    await settle(VIEWER_CATALOG_RETRY_MS);
    expect(calls("/api/catalog")).toBe(2);
    expect(availability.getStatus(true).available).toBe(true);
  });

  it("treats an invalid catalog payload as a failure", async () => {
    stubViewer({
      catalog: () => ({ body: { maxId: "nope" } }),
      rateLimit: healthyQuota
    });
    const availability = new ViewerServerAvailability();
    availability.start();
    await settle();
    expect(availability.getStatus(true)).toMatchObject({
      reason: "catalog-failed"
    });
  });

  it("reports rate-limit-check-failed when the check errors, and retries", async () => {
    let rateLimit: () => Reply = () => {
      throw new Error("timeout");
    };
    const { calls } = stubViewer({
      catalog: () => ({ body: CATALOG }),
      rateLimit: () => rateLimit()
    });
    const availability = new ViewerServerAvailability();
    availability.start();
    await settle();
    expect(availability.getStatus(true)).toEqual({
      available: false,
      reason: "rate-limit-check-failed",
      retryAt: Date.now() + VIEWER_RATE_LIMIT_RETRY_MS
    });
    rateLimit = healthyQuota;
    await settle(VIEWER_RATE_LIMIT_RETRY_MS);
    expect(calls("/api/rate-limit")).toBe(2);
    expect(availability.getStatus(true).available).toBe(true);
  });

  it("respects Retry-After when the check itself is throttled", async () => {
    const { calls } = stubViewer({
      catalog: () => ({ body: CATALOG }),
      rateLimit: () => ({ status: 429, headers: { "Retry-After": "45" } })
    });
    const availability = new ViewerServerAvailability();
    availability.start();
    await settle();
    expect(availability.getStatus(true)).toEqual({
      available: false,
      reason: "rate-limit-check-throttled",
      retryAt: Date.now() + 45_000
    });
    await settle(44_999);
    expect(calls("/api/rate-limit")).toBe(1);
    await settle(1);
    expect(calls("/api/rate-limit")).toBe(2);
  });

  it("holds an exhausted quota until it resets", async () => {
    const resetAt = Date.now() + 20 * 60_000;
    const { calls } = stubViewer({
      catalog: () => ({ body: CATALOG }),
      rateLimit: () => ({ body: { limit: 1000, remaining: 100, resetAt } })
    });
    const availability = new ViewerServerAvailability();
    availability.start();
    await settle();
    expect(availability.getStatus(true)).toEqual({
      available: false,
      reason: "rate-limit-exhausted",
      retryAt: resetAt
    });
    await settle(VIEWER_RATE_LIMIT_REFRESH_MS);
    expect(calls("/api/rate-limit")).toBe(1);
    await settle(resetAt - Date.now());
    expect(calls("/api/rate-limit")).toBe(2);
  });

  it("stops the loops and forgets its answers once disabled everywhere", async () => {
    const { calls } = stubViewer({
      catalog: () => ({ body: CATALOG }),
      rateLimit: healthyQuota
    });
    const availability = new ViewerServerAvailability();
    availability.start();
    await settle();
    ruleState.enabled = false;
    await settle(VIEWER_CATALOG_REFRESH_MS);
    const catalogCalls = calls("/api/catalog");
    const rateLimitCalls = calls("/api/rate-limit");
    await settle(VIEWER_CATALOG_REFRESH_MS * 2);
    expect(calls("/api/catalog")).toBe(catalogCalls);
    expect(calls("/api/rate-limit")).toBe(rateLimitCalls);

    ruleState.enabled = true;
    expect(availability.getStatus(true)).toEqual({
      available: false,
      reason: "pending"
    });
    await settle();
    expect(availability.getStatus(true).available).toBe(true);
  });
});
