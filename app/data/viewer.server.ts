/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { VIEWER_EMBED_URL } from "~/env.server";
import {
  steamCallbackUrl,
  viewerEnabled,
  viewerKey
} from "~/models/rule.server";
import { singleton } from "~/singleton.server";
import {
  DEFAULT_VIEWER_EMBED_URL,
  ViewerCatalog,
  ViewerServerReason,
  ViewerServerStatus
} from "./viewer";

export const VIEWER_FETCH_TIMEOUT_MS = 5_000;

export const VIEWER_CATALOG_REFRESH_MS = 300_000;

export const VIEWER_CATALOG_RETRY_MS = 30_000;

export const VIEWER_RATE_LIMIT_REFRESH_MS = 60_000;

export const VIEWER_RATE_LIMIT_RETRY_MS = 30_000;

// Floor for waits derived from the viewer's clock (Retry-After, resetAt), so a
// skewed or already-passed deadline can't spin the loop.
export const VIEWER_RATE_LIMIT_MIN_WAIT_MS = 5_000;

// The share of the public per-origin quota left for the viewer's own traffic;
// below it, the server stops handing out 3D.
export const VIEWER_MIN_REMAINING_RATIO = 0.1;

type CatalogState =
  | { status: "pending" }
  | { status: "ok"; catalog: ViewerCatalog }
  | { status: "failed" };

type RateLimitState =
  | { status: "pending" }
  | { status: "ok" }
  | {
      status: Extract<ViewerServerReason, `rate-limit-${string}`>;
      retryAt: number;
    };

interface RateLimitResponse {
  limit: number | null;
  remaining: number | null;
  resetAt: number | null;
}

function getViewerOrigin() {
  return new URL(VIEWER_EMBED_URL || DEFAULT_VIEWER_EMBED_URL).origin;
}

function isTrustedHostname(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "cstrike.app" ||
    hostname.endsWith(".cstrike.app")
  );
}

function parseCatalog(data: unknown): ViewerCatalog | undefined {
  const catalog = data as Partial<ViewerCatalog> | null;
  if (
    typeof catalog?.maxId !== "number" ||
    !Number.isFinite(catalog.maxId) ||
    !Array.isArray(catalog.holes)
  ) {
    return undefined;
  }
  const holes = catalog.holes.filter(
    (range): range is [number, number] =>
      Array.isArray(range) &&
      range.length === 2 &&
      typeof range[0] === "number" &&
      typeof range[1] === "number"
  );
  return { maxId: catalog.maxId, holes };
}

function describeError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

/**
 * A self-rescheduling task: `tick` returns the delay until its next run, or
 * `undefined` to stop. `start` is idempotent.
 */
class Loop {
  private running = false;

  constructor(private readonly tick: () => Promise<number | undefined>) {}

  start() {
    if (this.running) {
      return;
    }
    this.running = true;
    void this.run();
  }

  private async run() {
    const delay = await this.tick();
    if (delay === undefined) {
      this.running = false;
      return;
    }
    setTimeout(() => void this.run(), delay);
  }
}

/**
 * Decides, per request, whether the client may use the 3D viewer.
 *
 * Two loops keep the answer warm so the loader never waits on the viewer: one
 * mirrors the viewer's catalog, the other checks the public per-origin quota
 * (skipped with a partner key or on a trusted hostname). Both fail closed, so a
 * client is only handed 3D once both have a good answer. The loops run while
 * `viewerEnabled` is true for anyone (the rule or any user/group override), and
 * stop, dropping their state, once it isn't.
 */
export class ViewerServerAvailability {
  private catalog: CatalogState = { status: "pending" };
  private rateLimit: RateLimitState = { status: "pending" };
  private readonly catalogLoop = new Loop(() => this.tickCatalog());
  private readonly rateLimitLoop = new Loop(() => this.tickRateLimit());

  start() {
    this.catalogLoop.start();
    this.rateLimitLoop.start();
  }

  getStatus(enabled: boolean): ViewerServerStatus {
    if (!enabled) {
      return { available: false, reason: "disabled" };
    }
    this.start();
    const { catalog, rateLimit } = this;
    if (catalog.status === "pending" || rateLimit.status === "pending") {
      return { available: false, reason: "pending" };
    }
    if (catalog.status === "failed") {
      return { available: false, reason: "catalog-failed" };
    }
    if (rateLimit.status !== "ok") {
      return {
        available: false,
        reason: rateLimit.status,
        retryAt: rateLimit.retryAt
      };
    }
    return { available: true, catalog: catalog.catalog };
  }

  private async isEnabled() {
    try {
      return await viewerEnabled.isTrueForAnyone();
    } catch (error) {
      console.warn(
        `3D viewer: unable to read the viewerEnabled rule. ${describeError(error)}`
      );
      // Keep the loops (and their last answers) through a database hiccup.
      return true;
    }
  }

  private async tickCatalog() {
    if (!(await this.isEnabled())) {
      this.catalog = { status: "pending" };
      return undefined;
    }
    let catalog: ViewerCatalog | undefined;
    let failure: string | undefined;
    try {
      const response = await fetch(`${getViewerOrigin()}/api/catalog`, {
        signal: AbortSignal.timeout(VIEWER_FETCH_TIMEOUT_MS)
      });
      if (response.ok) {
        catalog = parseCatalog(await response.json());
        failure = catalog === undefined ? "invalid payload" : undefined;
      } else {
        failure = `HTTP ${response.status}`;
      }
    } catch (error) {
      failure = describeError(error);
    }
    if (catalog !== undefined) {
      this.catalog = { status: "ok", catalog };
      return VIEWER_CATALOG_REFRESH_MS;
    }
    if (this.catalog.status !== "failed") {
      console.warn(`3D viewer: catalog fetch failed (${failure}).`);
    }
    this.catalog = { status: "failed" };
    return VIEWER_CATALOG_RETRY_MS;
  }

  private async tickRateLimit() {
    if (!(await this.isEnabled())) {
      this.rateLimit = { status: "pending" };
      return undefined;
    }
    let hostname: string;
    let key: string;
    try {
      hostname = new URL(await steamCallbackUrl.get()).hostname;
      key = await viewerKey.get();
    } catch (error) {
      return this.setRateLimitFailure(describeError(error));
    }
    if (key.trim() !== "" || isTrustedHostname(hostname)) {
      this.rateLimit = { status: "ok" };
      return VIEWER_RATE_LIMIT_REFRESH_MS;
    }
    let response: Response;
    try {
      response = await fetch(`${getViewerOrigin()}/api/rate-limit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ domain: hostname }),
        signal: AbortSignal.timeout(VIEWER_FETCH_TIMEOUT_MS)
      });
    } catch (error) {
      return this.setRateLimitFailure(describeError(error));
    }
    if (response.status === 429) {
      const retryAfterSeconds = Number(response.headers.get("Retry-After"));
      const wait = Math.max(
        Number.isFinite(retryAfterSeconds)
          ? retryAfterSeconds * 1000
          : VIEWER_RATE_LIMIT_RETRY_MS,
        VIEWER_RATE_LIMIT_MIN_WAIT_MS
      );
      return this.setRateLimitBlocked("rate-limit-check-throttled", wait);
    }
    if (!response.ok) {
      return this.setRateLimitFailure(`HTTP ${response.status}`);
    }
    let body: RateLimitResponse;
    try {
      body = (await response.json()) as RateLimitResponse;
    } catch (error) {
      return this.setRateLimitFailure(describeError(error));
    }
    const { limit, remaining, resetAt } = body;
    if (
      limit !== null &&
      remaining !== null &&
      remaining <= limit * VIEWER_MIN_REMAINING_RATIO
    ) {
      const wait = Math.max(
        resetAt !== null ? resetAt - Date.now() : VIEWER_RATE_LIMIT_REFRESH_MS,
        VIEWER_RATE_LIMIT_MIN_WAIT_MS
      );
      return this.setRateLimitBlocked("rate-limit-exhausted", wait);
    }
    this.rateLimit = { status: "ok" };
    return VIEWER_RATE_LIMIT_REFRESH_MS;
  }

  private setRateLimitFailure(detail: string) {
    return this.setRateLimitBlocked(
      "rate-limit-check-failed",
      VIEWER_RATE_LIMIT_RETRY_MS,
      detail
    );
  }

  private setRateLimitBlocked(
    status: Extract<RateLimitState, { retryAt: number }>["status"],
    wait: number,
    detail?: string
  ) {
    if (this.rateLimit.status !== status) {
      console.warn(
        `3D viewer: ${status}${detail !== undefined ? ` (${detail})` : ""}, ` +
          `checking again in ${Math.round(wait / 1000)}s.`
      );
    }
    this.rateLimit = { status, retryAt: Date.now() + wait };
    return wait;
  }
}

export const viewerServerAvailability = singleton(
  "viewerServerAvailability",
  () => new ViewerServerAvailability()
);
