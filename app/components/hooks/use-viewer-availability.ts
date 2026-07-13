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

let cooldownUntil = 0;
let cooldownTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

const NETWORK_BASE_MS = 30_000;
const NETWORK_CAP_MS = 8 * 60_000;
const WEBGL_COOLDOWN_MS = 5 * 60_000;
let networkBackoffStep = 0;
let backoffResetTimer: ReturnType<typeof setTimeout> | undefined;
// Quiet time after a cooldown clears before the backoff streak resets. Must
// exceed the viewer's own retry budget (~90s: 3 attempts x 30s timeout in its
// fetch-asset.ts), or a persistently stalling CDN would reset the streak every
// cycle and defeat the backoff.
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
  if (backoffResetTimer !== undefined) {
    clearTimeout(backoffResetTimer);
  }
  backoffResetTimer = setTimeout(() => {
    networkBackoffStep = 0;
  }, wait + BACKOFF_RESET_GRACE_MS);
}

export function useViewerAvailability(
  item?: ViewerItemInput,
  { attachment = false }: { attachment?: boolean } = {}
) {
  const {
    viewerAttachmentsOnly,
    viewerEnabled,
    viewerOriginAllowed,
    viewerCatalog
  } = useRules();
  const { prefer2dStickerEditor } = usePreferences();
  const until = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const globalAvailable =
    viewerEnabled === true &&
    viewerOriginAllowed === true &&
    (attachment ? !prefer2dStickerEditor : viewerAttachmentsOnly !== true) &&
    Date.now() >= until;
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
