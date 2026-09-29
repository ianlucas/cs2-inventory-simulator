/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  getViewerCatalog,
  getViewerItemKey,
  isViewerIdSupported,
  isViewerItemSupported,
  ViewerItemInput,
  ViewerItemKind,
  ViewerServerReason,
  ViewerServerStatusLike
} from "~/data/viewer";
import { clientGlobals, isServerContext } from "~/globals";
import { logWarning } from "~/shared/monitoring";
import type { ViewerUnsupportedReason } from "~/viewer-api.client";

// How long a `timeout` or `network` failure keeps new viewers from mounting,
// indexed by consecutive failures; the last entry repeats.
export const VIEWER_BACKOFF_DELAYS_MS = [
  0, 500, 1_000, 2_000, 3_000, 4_000, 5_000
];

// Quiet time after a backoff clears before the streak resets.
export const VIEWER_BACKOFF_RESET_MS = 120_000;

export type ViewerClientReason =
  "webgl" | "rate-limited" | "timeout" | "network";

/**
 * The page-wide viewer state. `reason` and `retryAt` describe the latest
 * failure and stay set after it clears, so a fallback can still be explained.
 * `retryable` is false when only a reload can bring 3D back.
 */
export interface ViewerClientState {
  available: boolean;
  reason?: ViewerClientReason;
  retryable: boolean;
  retryAt?: number;
}

export interface ViewerBlockedItem {
  key: string;
  reason: ViewerUnsupportedReason;
  at: number;
}

export interface ViewerStatusReport {
  server:
    | { available: true; catalog: { maxId: number; holes: number } }
    | { available: false; reason: ViewerServerReason; retryAt?: number }
    | undefined;
  client: ViewerClientState;
  items: ViewerBlockedItem[];
}

interface Failure {
  reason: ViewerClientReason;
  retryable: boolean;
  retryAt: number;
}

/**
 * Whether the 3D viewer can be used on this page, and why not.
 *
 * Combines the server's verdict (passed in by the caller, as it arrives through
 * the root loader and must render identically on the server) with failures the
 * viewers on this page reported: page-wide ones (`webgl`, instance-wide rate
 * limits, timeouts, network) and per-item ones (catalog mismatches), which only
 * block that item for the rest of the page session. State lives in memory, so a
 * reload clears it.
 */
export class ViewerClientAvailability {
  private server: ViewerServerStatusLike | undefined;
  private failure: Failure | undefined;
  private readonly blocked = new Map<string, ViewerBlockedItem>();
  private backoffStep = 0;
  private backoffResetTimer: ReturnType<typeof setTimeout> | undefined;
  private expiryTimer: ReturnType<typeof setTimeout> | undefined;
  private version = 0;
  private readonly listeners = new Set<() => void>();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.version;

  /**
   * Records the server verdict last received, for getStatus.
   */
  setServerStatus(status: ViewerServerStatusLike) {
    this.server = status;
  }

  getClientState(now = Date.now()): ViewerClientState {
    const { failure } = this;
    if (failure === undefined) {
      return { available: true, retryable: true };
    }
    return {
      available: failure.retryable && now >= failure.retryAt,
      reason: failure.reason,
      retryable: failure.retryable,
      retryAt: failure.retryable ? failure.retryAt : undefined
    };
  }

  isAvailable(server: ViewerServerStatusLike) {
    return server.available && this.getClientState().available;
  }

  isIdSupported(server: ViewerServerStatusLike, id: number) {
    return isViewerIdSupported(getViewerCatalog(server), id);
  }

  isItemSupported(
    server: ViewerServerStatusLike,
    item: ViewerItemInput,
    kinds?: ReadonlySet<ViewerItemKind>
  ) {
    return (
      isViewerItemSupported(getViewerCatalog(server), item, kinds) &&
      !this.blocked.has(getViewerItemKey(item))
    );
  }

  reportRateLimited(retryAfterMs: number) {
    this.fail("rate-limited", Math.max(0, retryAfterMs));
  }

  reportTimeout() {
    this.failWithBackoff("timeout");
  }

  reportUnsupported(
    item: ViewerItemInput | undefined,
    reason: ViewerUnsupportedReason
  ) {
    switch (reason) {
      case "webgl":
        return this.fail("webgl");
      case "network":
      case "asset":
        return this.failWithBackoff("network");
      default: {
        if (item === undefined) {
          return;
        }
        const key = getViewerItemKey(item);
        this.blocked.set(key, { key, reason, at: Date.now() });
        logWarning(
          `[InventorySimulator] 3D viewer can't render an item (${reason}); using 2D for it.`,
          { extra: { key } }
        );
        return this.emit();
      }
    }
  }

  getStatus(): ViewerStatusReport {
    const { server } = this;
    return {
      server:
        server?.available === true
          ? {
              available: true,
              catalog: {
                maxId: server.catalog.maxId,
                holes: server.catalog.holes.length
              }
            }
          : server,
      client: this.getClientState(),
      items: [...this.blocked.values()]
    };
  }

  private failWithBackoff(reason: ViewerClientReason) {
    const wait =
      VIEWER_BACKOFF_DELAYS_MS[
        Math.min(this.backoffStep, VIEWER_BACKOFF_DELAYS_MS.length - 1)
      ];
    this.backoffStep++;
    clearTimeout(this.backoffResetTimer);
    this.backoffResetTimer = setTimeout(() => {
      this.backoffStep = 0;
    }, wait + VIEWER_BACKOFF_RESET_MS);
    this.fail(reason, wait);
  }

  // A page-wide failure only ever extends the current one: a non-retryable
  // failure sticks, otherwise the later retryAt wins.
  private fail(reason: ViewerClientReason, wait?: number) {
    const current = this.failure;
    if (current !== undefined && !current.retryable) {
      return;
    }
    const now = Date.now();
    const retryable = wait !== undefined;
    const retryAt = now + (wait ?? 0);
    const isActive = current !== undefined && now < current.retryAt;
    if (retryable && isActive && retryAt <= current.retryAt) {
      return;
    }
    this.failure = { reason, retryable, retryAt };
    console.warn(
      `[InventorySimulator] 3D viewer unavailable (${reason}); ` +
        (retryable
          ? `retrying ${wait === 0 ? "on the next view" : `in ${wait}ms`}.`
          : "reload the page to retry.")
    );
    clearTimeout(this.expiryTimer);
    if (wait !== undefined && wait > 0) {
      this.expiryTimer = setTimeout(() => this.emit(), wait);
    }
    this.emit();
  }

  private emit() {
    this.version++;
    for (const listener of this.listeners) {
      listener();
    }
  }
}

export const viewerClientAvailability = new ViewerClientAvailability();

if (!isServerContext) {
  clientGlobals.getViewerStatus = () => viewerClientAvailability.getStatus();
}
