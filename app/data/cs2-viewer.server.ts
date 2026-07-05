/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2_VIEWER_BASE_URL, ViewerCatalog } from "./cs2-viewer";

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

// --- Viewer support manifest (#17) -------------------------------------------------------------

// How long a fetched catalog stays warm before a background refresh. The renderable set only changes
// on a viewer deploy, so this is long; a refresh (or any host page reload, which re-runs the loader)
// picks up a deploy within the window without an app restart.
const VIEWER_CATALOG_TTL_MS = 300_000;

// Negative verdict cached after a failed fetch (fail-closed) — short, so 3D returns quickly once the
// endpoint is reachable again.
const VIEWER_CATALOG_ERROR_TTL_MS = 30_000;

interface CatalogCacheEntry {
  expiresAt: number;
  // undefined = the fetch failed/was malformed; the gate treats it as "nothing supported" (2D).
  catalog: ViewerCatalog | undefined;
}

// A single global entry (the manifest isn't per-embedder, unlike the origin peek). Module-level =
// process-lifetime, refreshed in the background (stale-while-revalidate).
let catalogCache: CatalogCacheEntry | undefined;
let catalogInFlight = false;

async function fetchViewerCatalog(): Promise<ViewerCatalog | undefined> {
  const response = await fetch(`${getViewerOrigin()}/api/catalog`);
  if (!response.ok) {
    return undefined;
  }
  const data = (await response.json()) as Partial<ViewerCatalog> | null;
  if (
    typeof data?.maxId !== "number" ||
    !Number.isFinite(data.maxId) ||
    !Array.isArray(data.holes)
  ) {
    return undefined;
  }
  // Keep only well-formed [lo, hi] pairs; drop anything malformed rather than trust it.
  const holes = data.holes.filter(
    (range): range is [number, number] =>
      Array.isArray(range) &&
      range.length === 2 &&
      typeof range[0] === "number" &&
      typeof range[1] === "number"
  );
  return { maxId: data.maxId, holes };
}

function refreshViewerCatalog() {
  if (catalogInFlight) {
    return;
  }
  catalogInFlight = true;
  // Fail closed: any error caches an undefined verdict (short TTL) so the gate stays on 2D rather
  // than optimistically offering a viewer we can't vouch for.
  fetchViewerCatalog()
    .then((catalog) => {
      catalogCache = {
        expiresAt:
          Date.now() +
          (catalog === undefined
            ? VIEWER_CATALOG_ERROR_TTL_MS
            : VIEWER_CATALOG_TTL_MS),
        catalog
      };
    })
    .catch(() => {
      catalogCache = {
        expiresAt: Date.now() + VIEWER_CATALOG_ERROR_TTL_MS,
        catalog: undefined
      };
    })
    .finally(() => {
      catalogInFlight = false;
    });
}

/**
 * Resolves, synchronously, the viewer's support manifest — the id envelope the item-aware 3D gate
 * checks against (see isViewerItemSupported). Stale-while-revalidate + fail-closed, mirroring
 * {@link resolveCan3dViewerOrigin}: the loader never blocks on the external request, and an
 * unreachable/never-fetched manifest reads as `undefined` (every item unsupported → 2D) until a
 * background refresh lands. A viewer deploy is picked up within the TTL, or on the next host reload.
 */
export function resolveViewerCatalog(): ViewerCatalog | undefined {
  const cached = catalogCache;
  if (cached === undefined || cached.expiresAt <= Date.now()) {
    refreshViewerCatalog();
  }
  return cached?.catalog;
}
