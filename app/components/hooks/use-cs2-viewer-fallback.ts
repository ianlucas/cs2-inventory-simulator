/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";
import { Cs2ViewerApi } from "~/utils/cs2-viewer-api";
import { markCs2ViewerRateLimited } from "./use-cs2-viewer-availability";

// How long to wait for the viewer's ready handshake before falling back to the 2D flow,
// so a down/blocked viewer doesn't strand the user on a blank overlay.
const VIEWER_READY_TIMEOUT_MS = 6000;

// Client-side cooldown applied when the viewer fails to become ready (not a rate limit,
// but the same "fall back to 2D for a bit" behavior).
const VIEWER_UNREACHABLE_COOLDOWN_MS = 30_000;

export type Cs2ViewerFallbackStatus = "pending" | "ready" | "unavailable";

/**
 * Drives the shared "fall back to 2D" policy for a viewer overlay. It records a viewer
 * rate-limit cooldown — skipping transient per-user (`scope: "ip"`) limits, but acting on
 * instance-wide ones — and, if the viewer never reports ready within
 * {@link VIEWER_READY_TIMEOUT_MS}, starts the same cooldown itself. Either way
 * {@link useCs2ViewerAvailability} then flips the parent back to the 2D flow.
 *
 * Returns the readiness status so each flow reacts in its own effect: `"ready"` to drive
 * the model, `"unavailable"` (a missed handshake *or* an instance-wide rate limit) to
 * preserve in-progress edits before the swap. `"ready"` and `"unavailable"` are mutually
 * exclusive; an instance-wide rate limit moves a once-`"ready"` viewer to `"unavailable"`.
 */
export function useCs2ViewerFallback(
  api: Cs2ViewerApi | undefined
): Cs2ViewerFallbackStatus {
  const [status, setStatus] = useState<Cs2ViewerFallbackStatus>("pending");

  useEffect(() => {
    if (api === undefined) {
      return;
    }
    // Reset for a fresh api (no-op when already pending); the viewer is created once per
    // mount, so in practice this only ever transitions pending -> ready|unavailable once.
    setStatus("pending");
    // `settled` guards the ready-vs-timeout race so only the first of the two wins. An
    // instance-wide rate limit is independent: it falls back even after `"ready"`.
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      markCs2ViewerRateLimited(VIEWER_UNREACHABLE_COOLDOWN_MS);
      setStatus("unavailable");
    }, VIEWER_READY_TIMEOUT_MS);
    const offRateLimited = api.on("rateLimited", ({ retryAfterMs, scope }) => {
      // Per-user limits (scope "ip") are transient and the viewer auto-retries, so let it
      // recover in place. Instance-wide cases (or an unknown scope) persist, so record the
      // backoff and fall back — even if the viewer had already become ready.
      if (scope === "ip") {
        return;
      }
      markCs2ViewerRateLimited(retryAfterMs);
      settled = true;
      clearTimeout(timer);
      setStatus("unavailable");
    });
    // The viewer reported it can't render the requested item (unknown weapon/sticker id — a cs2-lib
    // catalog mismatch that slipped past the manifest gate in a stale-manifest race — or a hard asset
    // failure). Fall back to 2D exactly like an instance-wide rate limit, reusing the same module
    // cooldown: it flips the parent off 3D, which both drives the swap and breaks the reopen loop.
    // ~30s is long enough to clear the current interaction and short enough that an unrelated item
    // returns to 3D promptly.
    const offUnsupported = api.on("unsupported", () => {
      markCs2ViewerRateLimited(VIEWER_UNREACHABLE_COOLDOWN_MS);
      settled = true;
      clearTimeout(timer);
      setStatus("unavailable");
    });
    void api.whenReady().then(() => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      setStatus("ready");
    });
    return () => {
      clearTimeout(timer);
      offRateLimited();
      offUnsupported();
    };
  }, [api]);

  return status;
}
