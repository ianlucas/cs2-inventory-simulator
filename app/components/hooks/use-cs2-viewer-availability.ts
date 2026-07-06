/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useCallback, useSyncExternalStore } from "react";
import { usePreferences, useRules } from "~/components/app-context";
import {
  Cs2ViewerItemInput,
  isViewerIdSupported,
  isViewerItemSupported
} from "~/data/cs2-viewer";

// Module-level cooldown shared across the whole app: when the viewer reports a
// rate limit — for this user via scope "ip", or for the whole instance via
// scope "origin"/"partner" — we stop offering the 3D viewer until the
// server-provided backoff elapses, then re-render subscribers so the UI returns
// to 3D on its own.
let cooldownUntil = 0;
let cooldownTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

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
export function markCs2ViewerRateLimited(retryAfterMs: number) {
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
 * Single source of truth for "can we show the 3D viewer right now?", combining
 * the master rule, the server-resolved origin budget verdict, any live
 * rate-limit cooldown, the user's preference to stick with the 2D sticker
 * editors, and — when an `item` is passed — whether the viewer's catalog can
 * render that specific item and every sticker it already carries. The decision
 * is a synchronous read — callers never await — so opening the editor is instant.
 *
 * Pass the item being crafted/edited/stickered to gate on it (a viewer-unknown
 * weapon or existing sticker falls back to 2D). Omit it for a global check, and
 * use `isStickerSupported(id)` to filter per-sticker (e.g. the sticker modal).
 */
export function useCs2ViewerAvailability(item?: Cs2ViewerItemInput) {
  const { appEnable3dViewer, can3dViewerOrigin, viewerCatalog } = useRules();
  const { prefer2dStickerEditor } = usePreferences();
  const until = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // The global gate: feature on, origin within budget, no active rate-limit cooldown, and the user
  // hasn't opted into the 2D editors.
  const globalAvailable =
    appEnable3dViewer === true &&
    can3dViewerOrigin === true &&
    !prefer2dStickerEditor &&
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
    markRateLimited: markCs2ViewerRateLimited
  };
}
