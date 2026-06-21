/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useSyncExternalStore } from "react";
import { useRules } from "~/components/app-context";

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
 * the master rule, the server-resolved origin budget verdict, and any live
 * rate-limit cooldown. The decision is a synchronous boolean read — callers
 * never await — so opening the editor is instant.
 */
export function useCs2ViewerAvailability() {
  const { appEnable3dViewer, can3dViewerOrigin } = useRules();
  const until = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const canUse3d =
    appEnable3dViewer === true &&
    can3dViewerOrigin === true &&
    Date.now() >= until;
  return { canUse3d, markRateLimited: markCs2ViewerRateLimited };
}
