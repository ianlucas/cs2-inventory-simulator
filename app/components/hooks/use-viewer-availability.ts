/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useCallback, useSyncExternalStore } from "react";
import { usePreferences, useRules } from "~/components/app-context";
import {
  ViewerItemInput,
  isViewerIdSupported,
  isViewerItemSupported
} from "~/data/viewer";
import type { ViewerUnsupportedReason } from "~/utils/viewer-api";

// Module-level cooldown shared across the whole app: when the viewer reports a
// rate limit — for this user via scope "ip", or for the whole instance via
// scope "origin"/"partner" — we stop offering the 3D viewer until the
// server-provided backoff elapses, then re-render subscribers so the UI returns
// to 3D on its own.
let cooldownUntil = 0;
let cooldownTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

// Cooldown lengths per `unsupported` reason (see markViewerUnsupported).
const NETWORK_BASE_MS = 30_000; // a transient load failure — try 3D again soon
const NETWORK_CAP_MS = 8 * 60_000; // ...but cap the exponential backoff
const WEBGL_COOLDOWN_MS = 5 * 60_000; // device can't do 3D — don't re-probe every 30s
// How many times in a row the viewer has failed with a transient (network) reason. Drives the
// exponential backoff so a persistently-blocked CDN (e.g. behind the Great Firewall) settles into 2D
// instead of ping-ponging the user back to a blank 3D view every 30s. It resets on its OWN — not on
// the viewer's `ready` handshake, which fires even when the render then fails (that would reset the
// streak every cycle and defeat the backoff) — via a quiet-period timer: if the cooldown clears and
// no new failure arrives, the blip passed and the streak returns to zero.
let networkBackoffStep = 0;
let backoffResetTimer: ReturnType<typeof setTimeout> | undefined;
// Extra quiet time after a cooldown clears before we call the streak over: the returned-to-3D viewer
// must get all the way THROUGH its own retry budget WITHOUT failing again before we count the block as
// gone. That budget is the viewer's ATTEMPTS × per-attempt TIMEOUT (3 × 30s ≈ 90s in the viewer's
// fetch-asset.ts) plus its ready handshake, so this must exceed ~90s. Otherwise a persistently STALLING
// CDN — every attempt times out, so the viewer takes ~90s to fail again — would reset the streak every
// cycle (its next failure lands after the timer fires) and defeat the backoff, ping-ponging the user
// between 2D and a ~90s-loading 3D view forever. Keep in step if the viewer's retry budget changes.
const BACKOFF_RESET_GRACE_MS = 120_000;

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return cooldownUntil;
}

function getServerSnapshot() {
  return 0;
}

/**
 * Records a viewer rate-limit backoff. Called from the viewer overlay's
 * `rateLimited` handler. Extends (never shortens) the cooldown and schedules a
 * re-render for when it elapses so consumers flip back to the 3D viewer.
 */
export function markViewerRateLimited(retryAfterMs: number) {
  const until = Date.now() + Math.max(0, retryAfterMs);
  if (until <= cooldownUntil) {
    return;
  }
  cooldownUntil = until;
  if (cooldownTimer !== undefined) {
    clearTimeout(cooldownTimer);
  }
  cooldownTimer = setTimeout(emit, until - Date.now());
  emit();
}

/**
 * Records a viewer `unsupported` report, deriving the cooldown from its reason:
 *  - "webgl": the device can't do 3D (WebGL/hardware accel, or a context that keeps dying) — a fixed,
 *    longer suppression, since it won't clear on a 30s retry and the viewer re-probes cheaply anyway.
 *  - "network"/"asset"/unknown: a transient load failure — a short cooldown that backs off
 *    exponentially on repeats (30s → 1m → 2m …, capped) so a persistently-blocked CDN settles into 2D
 *    instead of ping-ponging the user (the streak self-clears via the quiet-period timer above).
 *  - "weapon"/"sticker": a catalog mismatch handled per-item by the viewerCatalog gate — a short cooldown
 *    just covers the current interaction.
 */
export function markViewerUnsupported(reason: ViewerUnsupportedReason) {
  if (reason === "webgl") {
    markViewerRateLimited(WEBGL_COOLDOWN_MS);
    return;
  }
  if (reason === "weapon" || reason === "sticker") {
    markViewerRateLimited(NETWORK_BASE_MS);
    return;
  }
  const wait = Math.min(
    NETWORK_BASE_MS * 2 ** networkBackoffStep,
    NETWORK_CAP_MS
  );
  networkBackoffStep++;
  markViewerRateLimited(wait);
  // Arm the quiet-period reset: if nothing fails again before this fires, the streak is over. A new
  // failure before then reschedules it, so a persistent block keeps climbing the backoff.
  if (backoffResetTimer !== undefined) {
    clearTimeout(backoffResetTimer);
  }
  backoffResetTimer = setTimeout(() => {
    networkBackoffStep = 0;
  }, wait + BACKOFF_RESET_GRACE_MS);
}

/**
 * Single source of truth for "can we show the 3D viewer right now?", combining
 * the master rule, the server-resolved origin budget verdict, any live
 * rate-limit cooldown, the user's preference to stick with the 2D sticker
 * editors, and — when an `item` is passed — whether the viewer's catalog can
 * render that specific item and every sticker it already carries. The decision
 * is a synchronous read — callers never await — so opening the editor is instant.
 *
 * Pass the item being inspected/crafted/edited/stickered to gate on it (a kind the
 * viewer never renders — music kit, collectible, agent, ... — or a viewer-unknown
 * weapon or existing sticker falls back to 2D). Omit it for a global check, and
 * use `isStickerSupported(id)` to filter per-sticker (e.g. the sticker modal).
 *
 * `prefer2dStickerEditor` is named for (and scoped to) the sticker editors, so the
 * read-only 3D inspect view opts out of it with `respectStickerEditorPreference: false`
 * — it still shares every other signal (master rule, budget, cooldown, catalog).
 */
export function useViewerAvailability(
  item?: ViewerItemInput,
  {
    respectStickerEditorPreference = true
  }: { respectStickerEditorPreference?: boolean } = {}
) {
  const { appEnable3dViewer, can3dViewerOrigin, viewerCatalog } = useRules();
  const { prefer2dStickerEditor } = usePreferences();
  const until = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // The global gate: feature on, origin within budget, no active rate-limit cooldown, and — unless the
  // caller opts out — the user hasn't opted into the 2D editors.
  const globalAvailable =
    appEnable3dViewer === true &&
    can3dViewerOrigin === true &&
    (!respectStickerEditorPreference || !prefer2dStickerEditor) &&
    Date.now() >= until;
  // Item-aware: 3D-eligible only if the viewer can render this item AND all its current stickers.
  const canUse3d =
    globalAvailable &&
    (item === undefined || isViewerItemSupported(viewerCatalog, item));
  const isStickerSupported = useCallback(
    (id: number) => isViewerIdSupported(viewerCatalog, id),
    [viewerCatalog]
  );
  return {
    canUse3d,
    isStickerSupported,
    markRateLimited: markViewerRateLimited
  };
}
