/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";
import { ViewerApi } from "~/utils/viewer-api";
import {
  markViewerRateLimited,
  markViewerUnsupported
} from "./use-viewer-availability";

// How long to wait for the viewer's ready handshake before falling back to the 2D flow,
// so a down/blocked viewer doesn't strand the user on a blank overlay.
const VIEWER_READY_TIMEOUT_MS = 6000;

export type ViewerFallbackStatus = "pending" | "ready" | "unavailable";

/**
 * Drives the shared "fall back to 2D" policy for a viewer overlay. It records a viewer
 * rate-limit cooldown — skipping transient per-user (`scope: "ip"`) limits, but acting on
 * instance-wide ones — and, if the viewer never reports ready within
 * {@link VIEWER_READY_TIMEOUT_MS}, starts the same cooldown itself. Either way
 * {@link useViewerAvailability} then flips the parent back to the 2D flow.
 *
 * Returns the readiness status so each flow reacts in its own effect: `"ready"` to drive
 * the model, `"unavailable"` (a missed handshake *or* an instance-wide rate limit) to
 * preserve in-progress edits before the swap. `"ready"` and `"unavailable"` are mutually
 * exclusive; an instance-wide rate limit moves a once-`"ready"` viewer to `"unavailable"`.
 */
export function useViewerFallback(
  api: ViewerApi | undefined
): ViewerFallbackStatus {
  const [status, setStatus] = useState<ViewerFallbackStatus>("pending");

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
      // The viewer never handshook — down/blocked/unreachable. Treat it as a transient network failure
      // so repeated unreachability climbs the same exponential backoff (no 30s ping-pong).
      markViewerUnsupported("network");
      setStatus("unavailable");
    }, VIEWER_READY_TIMEOUT_MS);
    const offRateLimited = api.on("rateLimited", ({ retryAfterMs, scope }) => {
      // Per-user limits (scope "ip") are transient and the viewer auto-retries, so let it
      // recover in place. Instance-wide cases (or an unknown scope) persist, so record the
      // backoff and fall back — even if the viewer had already become ready.
      if (scope === "ip") {
        return;
      }
      markViewerRateLimited(retryAfterMs);
      settled = true;
      clearTimeout(timer);
      setStatus("unavailable");
    });
    // The viewer reported it can't render the requested item — a WebGL/device failure, an asset/API
    // load that failed after its own retries (a GFW-blocked CDN), or a cs2-lib catalog mismatch. Fall
    // back to 2D, with a cooldown whose length the reason decides (markViewerUnsupported): device
    // failures suppress 3D longer, transient network failures back off on repeats so a blocked CDN
    // stops ping-ponging the user. This flips the parent off 3D, driving the swap and breaking the
    // reopen loop.
    const offUnsupported = api.on("unsupported", ({ reason }) => {
      markViewerUnsupported(reason);
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
