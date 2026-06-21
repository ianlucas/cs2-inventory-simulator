/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2_VIEWER_BASE_URL } from "./cs2-viewer";

// Fraction of the origin's request budget we keep in reserve before offering
// the 3D viewer to a non-trusted origin.
const VIEWER_MIN_REMAINING_RATIO = 0.1;

// How long a peek verdict stays warm. The peek never consumes quota, so a short
// cache keeps us far under the endpoint's own per-IP throttle (≤1 call/min)
// while staying fresh enough to react to origin exhaustion within the minute.
const VIEWER_PEEK_TTL_MS = 60_000;

// Negative verdict cached after a failed peek (fail closed) — short enough to
// recover quickly once the viewer is reachable again.
const VIEWER_PEEK_ERROR_TTL_MS = 30_000;

interface PeekResponse {
  limit: number | null;
  remaining: number | null;
}

interface PeekCacheEntry {
  expiresAt: number;
  verdict: boolean;
}

const peekCache = new Map<string, PeekCacheEntry>();
const peekInFlight = new Set<string>();

function getViewerOrigin() {
  return new URL(CS2_VIEWER_BASE_URL).origin;
}

// Origins we treat as trusted and therefore exempt from the budget check:
// local development and our own *.cstrike.app deployments.
function isTrustedViewerHostname(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "cstrike.app" ||
    hostname.endsWith(".cstrike.app")
  );
}

async function peekOriginAllowed(domain: string) {
  const response = await fetch(`${getViewerOrigin()}/api/rate-limit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ domain })
  });
  if (!response.ok) {
    return false;
  }
  const { limit, remaining } = (await response.json()) as PeekResponse;
  // No reported limit means unlimited budget; otherwise keep the reserve buffer.
  if (remaining === null || limit === null) {
    return true;
  }
  return remaining > limit * VIEWER_MIN_REMAINING_RATIO;
}

function refreshPeek(domain: string) {
  if (peekInFlight.has(domain)) {
    return;
  }
  peekInFlight.add(domain);
  // Fail closed: any error caches a negative verdict so we neither hammer the
  // endpoint nor optimistically show a viewer we can't back.
  peekOriginAllowed(domain)
    .then((verdict) => {
      peekCache.set(domain, {
        expiresAt: Date.now() + VIEWER_PEEK_TTL_MS,
        verdict
      });
    })
    .catch(() => {
      peekCache.set(domain, {
        expiresAt: Date.now() + VIEWER_PEEK_ERROR_TTL_MS,
        verdict: false
      });
    })
    .finally(() => {
      peekInFlight.delete(domain);
    });
}

/**
 * Resolves, synchronously, whether the 3D viewer should be offered for this app
 * instance's origin. Disabled and trusted instances answer with no network at
 * all; other origins are gated by a cached, background-refreshed peek of the
 * remaining request budget (stale-while-revalidate, fail-closed), so the loader
 * never blocks on an external request.
 */
export function resolveCan3dViewerOrigin({
  enabled,
  hostname,
  key
}: {
  enabled: boolean;
  hostname: string;
  key: string;
}) {
  if (!enabled) {
    return false;
  }
  if (key.trim() !== "" || isTrustedViewerHostname(hostname)) {
    return true;
  }
  const cached = peekCache.get(hostname);
  if (cached === undefined || cached.expiresAt <= Date.now()) {
    refreshPeek(hostname);
  }
  return cached?.verdict ?? false;
}
