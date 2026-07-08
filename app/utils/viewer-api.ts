/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2BaseInventoryItem } from "@ianlucas/cs2-lib";
import { ViewerItemInput, toViewerItem } from "~/data/viewer";

// The viewer's postMessage namespace + protocol version.
const VIEWER_SOURCE = "3d.cstrike.app";
const VIEWER_PROTOCOL_VERSION = 1;

// The subset of a CS2BaseInventoryItem the viewer reads (same shape as `?item=`).
export type ViewerItem = Pick<
  CS2BaseInventoryItem,
  "id" | "seed" | "wear" | "stickers" | "statTrak" | "nameTag"
>;

// The observable viewer state, reported by `getState` and the `change` event.
export interface ViewerState {
  item: ViewerItem;
  activeSticker: number | null;
  schemaCount: number;
}

// Which rate limit bound; absent when the server didn't report a known bucket.
export type RateLimitScope = "ip" | "origin" | "partner";

// Why the viewer can't render the requested item, which the host maps to a cooldown LENGTH (see
// markViewerUnsupported):
//  - "webgl"   — the device can't do 3D at all (WebGL / hardware acceleration unavailable, or a context
//                that keeps dying). Device-level → suppress 3D for a good while.
//  - "network" — an asset/API load failed AFTER the viewer's own retries (e.g. a Great-Firewall-
//                throttled CDN edge). Transient → short cooldown, but back off if it keeps failing.
//  - "weapon" / "sticker" — a cs2-lib catalog mismatch (the per-item viewerCatalog gate handles it).
// Any of them flips the host back to its 2D editor. "asset" is the pre-reason-split name, still
// accepted (and treated as network) from a stale/cached viewer build.
export type ViewerUnsupportedReason =
  "weapon" | "sticker" | "network" | "webgl" | "asset";

// Events the viewer emits back to us. The `state` reply to `getState` is consumed
// by that promise, so it isn't surfaced as an event here.
export interface ViewerEventMap {
  ready: { v: number };
  change: ViewerState;
  loading: { busy: boolean };
  rateLimited: { retryAfterMs: number; scope?: RateLimitScope };
  unsupported: { reason: ViewerUnsupportedReason };
}

export interface ViewerApiOptions {
  // The viewer's origin, for postMessage targeting and inbound filtering.
  // Defaults to the origin of the iframe's `src`.
  origin?: string;
}

interface Envelope {
  source: typeof VIEWER_SOURCE;
  v: number;
  id?: string;
  type: string;
  data?: unknown;
}

interface PendingReply {
  resolve: (state: ViewerState) => void;
  reject: (error: Error) => void;
  timer?: ReturnType<typeof setTimeout>;
}

/**
 * Typed wrapper over the CS2 3D viewer's postMessage embed API. Construct it with
 * the viewer iframe; it owns the readiness handshake, buffers commands issued
 * before the viewer is ready, correlates `getState` replies, and re-emits viewer
 * events. Call `destroy()` when the iframe goes away.
 */
export class ViewerApi extends EventTarget {
  readonly origin: string;
  isReady = false;
  lastState: ViewerState | undefined;

  private readonly iframe: HTMLIFrameElement;
  private destroyed = false;
  private queue: (() => void)[] = [];
  private readyWaiters: (() => void)[] = [];
  private readonly pending = new Map<string, PendingReply>();

  constructor(iframe: HTMLIFrameElement, options?: ViewerApiOptions) {
    super();
    this.iframe = iframe;
    this.origin =
      options?.origin ?? new URL(iframe.src, window.location.href).origin;
    window.addEventListener("message", this.onMessage);
    iframe.addEventListener("load", this.onLoad);
    // The iframe may already have loaded (e.g. from cache) before we attached the
    // load listener, so solicit `ready` once now as well.
    this.solicitReady();
  }

  // --- events -------------------------------------------------------------

  // Subscribe to a viewer event. Returns an unsubscribe function.
  on<K extends keyof ViewerEventMap>(
    type: K,
    listener: (data: ViewerEventMap[K]) => void
  ): () => void {
    const handler = (event: Event) => {
      listener((event as CustomEvent<ViewerEventMap[K]>).detail);
    };
    this.addEventListener(type, handler);
    return () => this.removeEventListener(type, handler);
  }

  // Subscribe to the next occurrence of a viewer event, then auto-unsubscribe.
  once<K extends keyof ViewerEventMap>(
    type: K,
    listener: (data: ViewerEventMap[K]) => void
  ): () => void {
    const off = this.on(type, (data) => {
      off();
      listener(data);
    });
    return off;
  }

  // Resolves once the viewer is ready (immediately if it already is).
  whenReady(): Promise<void> {
    if (this.isReady) {
      return Promise.resolve();
    }
    return new Promise((resolve) => this.readyWaiters.push(resolve));
  }

  // --- commands -----------------------------------------------------------

  setItem(item: ViewerItemInput): void {
    this.send("setItem", { item: toViewerItem(item) });
  }

  setSeed(data: { seed: number }): void {
    this.send("setSeed", data);
  }

  setWear(data: { wear: number }): void {
    this.send("setWear", data);
  }

  addSticker(data: { id: number; schema?: number }): void {
    this.send("addSticker", data);
  }

  removeSticker(data: { index: number }): void {
    this.send("removeSticker", data);
  }

  setStickerWear(data: { index: number; wear: number }): void {
    this.send("setStickerWear", data);
  }

  setStickerOffset(data: { index: number; x: number; y: number }): void {
    this.send("setStickerOffset", data);
  }

  setStickerRotation(data: { index: number; rotation: number }): void {
    this.send("setStickerRotation", data);
  }

  setStickerSchema(data: { index: number; schema: number }): void {
    this.send("setStickerSchema", data);
  }

  setActiveSticker(data: { index: number | null }): void {
    this.send("setActiveSticker", data);
  }

  highlightSticker(data: { index: number }): void {
    this.send("highlightSticker", data);
  }

  ping(): void {
    this.send("ping");
  }

  // Pull the current viewer state. Rejects if no reply arrives within
  // `timeoutMs`; the timer starts when the request is actually sent (i.e. after
  // the viewer is ready), not while it is still queued.
  getState(timeoutMs = 5000): Promise<ViewerState> {
    const id = crypto.randomUUID();
    return new Promise<ViewerState>((resolve, reject) => {
      if (this.destroyed) {
        reject(new Error("ViewerApi: destroyed."));
        return;
      }
      // Register the pending reply now so destroy() can reject it even while it
      // is still queued; the timeout only starts once it is actually sent.
      const entry: PendingReply = { resolve, reject };
      this.pending.set(id, entry);
      this.enqueue(() => {
        if (this.destroyed) {
          return;
        }
        entry.timer = setTimeout(() => {
          this.pending.delete(id);
          reject(new Error("ViewerApi: getState timed out."));
        }, timeoutMs);
        this.post(this.envelope("getState", undefined, id));
      });
    });
  }

  // Low-level escape hatch for protocol commands not yet wrapped above (additive
  // commands stay on `v: 1`). Buffered until ready, like the typed commands.
  send(type: string, data?: unknown): void {
    const envelope = this.envelope(type, data);
    // `ping` must go out immediately — it is how we solicit `ready`.
    this.enqueue(() => this.post(envelope), type === "ping");
  }

  // Detach listeners, drop the command queue, and fail any in-flight getState.
  // Subsequent calls are no-ops.
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    window.removeEventListener("message", this.onMessage);
    this.iframe.removeEventListener("load", this.onLoad);
    this.queue = [];
    this.readyWaiters = [];
    for (const { reject, timer } of this.pending.values()) {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
      reject(new Error("ViewerApi: destroyed."));
    }
    this.pending.clear();
  }

  // --- internals ----------------------------------------------------------

  private envelope(type: string, data?: unknown, id?: string): Envelope {
    const envelope: Envelope = {
      source: VIEWER_SOURCE,
      v: VIEWER_PROTOCOL_VERSION,
      type
    };
    if (id !== undefined) envelope.id = id;
    if (data !== undefined) envelope.data = data;
    return envelope;
  }

  // Run `task` now if the viewer is ready (or if it is the handshake itself),
  // otherwise buffer it until the next `ready`.
  private enqueue(task: () => void, immediate = false): void {
    if (this.destroyed) {
      return;
    }
    if (this.isReady || immediate) {
      task();
    } else {
      this.queue.push(task);
    }
  }

  private post(envelope: Envelope): void {
    this.iframe.contentWindow?.postMessage(envelope, this.origin);
  }

  private flush(): void {
    if (this.isReady) {
      return;
    }
    this.isReady = true;
    const queue = this.queue;
    this.queue = [];
    for (const task of queue) {
      task();
    }
    const waiters = this.readyWaiters;
    this.readyWaiters = [];
    for (const resolve of waiters) {
      resolve();
    }
  }

  private dispatch<K extends keyof ViewerEventMap>(
    type: K,
    detail: ViewerEventMap[K]
  ): void {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  private readonly solicitReady = (): void => {
    if (this.destroyed) {
      return;
    }
    this.post(this.envelope("ping"));
  };

  private readonly onLoad = (): void => {
    this.solicitReady();
  };

  private readonly onMessage = (event: MessageEvent): void => {
    if (this.destroyed) return;
    // Only obey our own viewer: matching origin, our iframe's window, our
    // namespace + protocol version.
    if (event.origin !== this.origin) return;
    if (event.source !== this.iframe.contentWindow) return;
    const message = event.data as Partial<Envelope> | null;
    if (
      message?.source !== VIEWER_SOURCE ||
      message.v !== VIEWER_PROTOCOL_VERSION ||
      typeof message.type !== "string"
    ) {
      return;
    }
    const { id, type, data } = message;
    if (id !== undefined) {
      const pending = this.pending.get(id);
      if (pending !== undefined) {
        this.pending.delete(id);
        if (pending.timer !== undefined) {
          clearTimeout(pending.timer);
        }
        const state = data as ViewerState;
        this.lastState = state;
        pending.resolve(state);
        return;
      }
    }
    switch (type) {
      case "ready":
        this.flush();
        this.dispatch("ready", data as ViewerEventMap["ready"]);
        break;
      case "change": {
        const state = data as ViewerState;
        this.lastState = state;
        this.dispatch("change", state);
        break;
      }
      case "loading":
        this.dispatch("loading", data as ViewerEventMap["loading"]);
        break;
      case "rateLimited":
        this.dispatch("rateLimited", data as ViewerEventMap["rateLimited"]);
        break;
      case "unsupported":
        this.dispatch("unsupported", data as ViewerEventMap["unsupported"]);
        break;
    }
  };
}
