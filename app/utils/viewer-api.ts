/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2BaseInventoryItem } from "@ianlucas/cs2-lib";
import { ViewerItemInput, toViewerItem } from "~/data/viewer";

/**
 * The viewer's postMessage namespace.
 */
const VIEWER_SOURCE = "3d.cstrike.app";

/**
 * The viewer's postMessage protocol version.
 */
const VIEWER_PROTOCOL_VERSION = 1;

/**
 * The subset of a CS2BaseInventoryItem the viewer reads, the same shape as the
 * `?item=` query parameter.
 */
export type ViewerItem = Pick<
  CS2BaseInventoryItem,
  | "id"
  | "seed"
  | "wear"
  | "stickers"
  | "keychains"
  | "statTrak"
  | "nameTag"
  | "patches"
>;

/**
 * What the viewer canvas is editing: a sticker, the charm (whose index is always
 * 0, as a weapon carries one), or nothing. `activeSticker` is derived from it.
 */
export type ViewerSelection =
  | { kind: "sticker"; index: number }
  | { kind: "keychain"; index: number }
  | null;

/**
 * The observable viewer state, reported by `getState` and the `change` event.
 */
export interface ViewerState {
  item: ViewerItem;
  selection: ViewerSelection;
  activeSticker: number | null;
  schemaCount: number;
  keychainDefault?: { x: number; y: number; z: number } | null;
}

/**
 * Which rate limit bound; absent when the server didn't report a known bucket.
 */
export type RateLimitScope = "ip" | "origin" | "partner";

/**
 * Why the viewer can't render the requested item, which the host maps to a
 * cooldown LENGTH (see markViewerUnsupported).
 *
 * `webgl` means the device can't do 3D at all (WebGL or hardware acceleration
 * unavailable, or a context that keeps dying); being device-level, it suppresses
 * 3D for a good while. `network` means an asset or API load failed AFTER the
 * viewer's own retries (e.g. a Great-Firewall-throttled CDN edge); being
 * transient, it gets a short cooldown that backs off if it keeps failing.
 * `weapon`, `sticker`, `keychain` and `patch` are cs2-lib catalog mismatches,
 * handled by the per-item viewerCatalog gate; `keychain` also covers a charmed
 * weapon whose physics engine failed to load.
 *
 * Any of them flips the host back to its 2D editor. `asset` is the
 * pre-reason-split name, still accepted (and treated as network) from a stale or
 * cached viewer build.
 */
export type ViewerUnsupportedReason =
  "weapon" | "sticker" | "keychain" | "patch" | "network" | "webgl" | "asset";

/**
 * Why a capture produced no frame.
 *
 * Most arrive from the viewer: the `ViewerUnsupportedReason` set, plus
 * `untrusted` (the server reporting the partner key untrusted, as the public
 * tier declines to hand back a watermarked frame), `disabled` (a viewer loaded
 * without capture support) and `encode` (the frame failed to encode). `timeout`
 * comes from the viewer when the render never settled, or is synthesised by the
 * host when its own capture deadline expires.
 */
export type ViewerCaptureError =
  ViewerUnsupportedReason | "untrusted" | "disabled" | "timeout" | "encode";

/**
 * How long to wait for one capture. Generous because the viewer must compile
 * shaders and upload textures before the first frame of a cold item settles.
 */
export const VIEWER_CAPTURE_TIMEOUT_MS = 45_000;

/**
 * The reply to one `capture`: a WebP frame of the settled render, or why there
 * isn't one.
 *
 * `apiCalls` is what the capture spent against the viewer's per-IP cap. It is
 * reported rather than inferred because the viewer answers most repeat items
 * from a recipe cache keyed by economy id, so the cost of an item is not a
 * function of the item: the second Redline is free however its seed, wear and
 * stickers differ from the first.
 */
export interface ViewerCaptured {
  item: ViewerItem;
  image?: Blob;
  apiCalls: number;
  error?: ViewerCaptureError;
}

/**
 * Events the viewer emits back to us. The `state` reply to `getState` is
 * consumed by that promise, so it isn't surfaced as an event here.
 */
export interface ViewerEventMap {
  ready: { v: number };
  change: ViewerState;
  loading: { busy: boolean };
  rendered: { item: ViewerItem };
  rateLimited: { retryAfterMs: number; scope?: RateLimitScope };
  unsupported: { reason: ViewerUnsupportedReason };
}

export interface ViewerApiOptions {
  /**
   * The viewer's origin, for postMessage targeting and inbound filtering.
   * Defaults to the origin of the iframe's `src`.
   */
  origin?: string;
}

interface Envelope {
  source: typeof VIEWER_SOURCE;
  v: number;
  id?: string;
  type: string;
  data?: unknown;
}

/**
 * Which kind of correlated reply a pending request is waiting for. A `captured`
 * reply rides the same correlation path as a state snapshot but describes one
 * frame, so it must not become `lastState`.
 */
interface ReplyMap {
  state: ViewerState;
  captured: ViewerCaptured;
}

interface PendingReplyOf<K extends keyof ReplyMap> {
  kind: K;
  resolve: (data: ReplyMap[K]) => void;
  reject: (error: Error) => void;
  timer?: ReturnType<typeof setTimeout>;
}

type PendingReply = PendingReplyOf<"state"> | PendingReplyOf<"captured">;

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
  private readyWaiters: {
    resolve: () => void;
    reject: (error: Error) => void;
  }[] = [];
  private readonly pending = new Map<string, PendingReply>();

  /**
   * Attaches to the viewer iframe and starts the readiness handshake. The iframe
   * may already have loaded (e.g. from cache) before the load listener is
   * attached, so `ready` is solicited once up front as well.
   */
  constructor(iframe: HTMLIFrameElement, options?: ViewerApiOptions) {
    super();
    this.iframe = iframe;
    this.origin =
      options?.origin ?? new URL(iframe.src, window.location.href).origin;
    window.addEventListener("message", this.onMessage);
    iframe.addEventListener("load", this.onLoad);
    this.solicitReady();
  }

  /**
   * Subscribes to a viewer event. Returns an unsubscribe function.
   */
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

  /**
   * Subscribes to the next occurrence of a viewer event, then auto-unsubscribes.
   */
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

  /**
   * Resolves once the viewer is ready, immediately if it already is. Rejects if
   * the viewer is destroyed first.
   */
  whenReady(): Promise<void> {
    if (this.isReady) {
      return Promise.resolve();
    }
    if (this.destroyed) {
      return Promise.reject(new Error("ViewerApi: destroyed."));
    }
    return new Promise((resolve, reject) =>
      this.readyWaiters.push({ resolve, reject })
    );
  }

  setItem(item: ViewerItemInput): void {
    this.send("setItem", { item: toViewerItem(item) });
  }

  setStickerWear(data: { index: number; wear: number }): void {
    this.send("setStickerWear", data);
  }

  setStickerSchema(data: { index: number; schema: number }): void {
    this.send("setStickerSchema", data);
  }

  setActiveSticker(data: { index: number | null }): void {
    this.send("setActiveSticker", data);
  }

  setSelection(data: { selection: ViewerSelection }): void {
    this.send("setSelection", data);
  }

  highlightSticker(data: { index: number }): void {
    this.send("highlightSticker", data);
  }

  focusPatch(data: { slot: number }): void {
    this.send("focusPatch", data);
  }

  setKeychain(data: { index: number; id: number }): void {
    this.send("setKeychain", data);
  }

  removeKeychain(data: { index: number }): void {
    this.send("removeKeychain", data);
  }

  setKeychainSeed(data: { index: number; seed: number }): void {
    this.send("setKeychainSeed", data);
  }

  /**
   * Moves the charm to an absolute bone-space point. All three axes are
   * required, as the embed API treats a partial position as a silent no-op.
   */
  setKeychainPosition(data: {
    index: number;
    x: number;
    y: number;
    z: number;
  }): void {
    this.send("setKeychainPosition", data);
  }

  /**
   * Sends the charm back to the model's default location, i.e. the absence of
   * x/y/z, which cannot be expressed as a setKeychainPosition call.
   */
  clearKeychainPosition(data: { index: number }): void {
    this.send("clearKeychainPosition", data);
  }

  /**
   * CS2's "Next Pos": a uniform-random re-roll over the weapon's charm surface.
   */
  rerollKeychainPosition(data: { index: number }): void {
    this.send("rerollKeychainPosition", data);
  }

  ping(): void {
    this.send("ping");
  }

  /**
   * Pulls the current viewer state. Rejects if no reply arrives within
   * `timeoutMs`; the timer starts when the request is actually sent (i.e. after
   * the viewer is ready), not while it is still queued. The pending reply is
   * registered up front so that destroy() can reject it even while queued.
   */
  getState(timeoutMs = 5000): Promise<ViewerState> {
    return this.request("state", "getState", undefined, timeoutMs);
  }

  /**
   * Renders `item` and resolves with a WebP frame of it once the viewer has
   * quiesced: shaders compiled, textures uploaded, frame drawn.
   *
   * Only a viewer loaded with `capture` can answer, and only on the trusted
   * tier — a public-tier frame carries a watermark, which the viewer refuses to
   * hand back rather than let a host cache it. Both refusals arrive as an
   * `error` on a resolved reply, not a rejection: they are answers about the
   * item, and only a viewer that never replied at all is a timeout.
   */
  capture(
    item: ViewerItemInput,
    options?: { quality?: number; timeoutMs?: number }
  ): Promise<ViewerCaptured> {
    return this.request(
      "captured",
      "capture",
      { item: toViewerItem(item), quality: options?.quality },
      options?.timeoutMs ?? VIEWER_CAPTURE_TIMEOUT_MS
    );
  }

  /**
   * Sends a command that expects one correlated reply. The timeout starts when
   * the command is actually sent (i.e. after the viewer is ready), not while it
   * is still queued; the pending reply is registered up front so that destroy()
   * can reject it even while queued.
   */
  private request<K extends keyof ReplyMap>(
    kind: K,
    type: string,
    data: unknown,
    timeoutMs: number
  ): Promise<ReplyMap[K]> {
    const id = crypto.randomUUID();
    return new Promise<ReplyMap[K]>((resolve, reject) => {
      if (this.destroyed) {
        reject(new Error("ViewerApi: destroyed."));
        return;
      }
      // The map holds every reply kind, so the entry widens to the union here;
      // onMessage narrows it back by `kind` before resolving.
      const entry = { kind, resolve, reject } as PendingReply;
      this.pending.set(id, entry);
      this.enqueue(() => {
        if (this.destroyed) {
          return;
        }
        entry.timer = setTimeout(() => {
          this.pending.delete(id);
          reject(new Error(`ViewerApi: ${type} timed out.`));
        }, timeoutMs);
        this.post(this.envelope(type, data, id));
      });
    });
  }

  /**
   * Low-level escape hatch for protocol commands not yet wrapped above (additive
   * commands stay on `v: 1`). Buffered until ready, like the typed commands,
   * except for `ping`, which must go out immediately as it is how we solicit
   * `ready`.
   */
  send(type: string, data?: unknown): void {
    const envelope = this.envelope(type, data);
    this.enqueue(() => this.post(envelope), type === "ping");
  }

  /**
   * Detaches listeners, drops the command queue, and fails any in-flight
   * getState, capture or whenReady. Subsequent calls are no-ops.
   */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    window.removeEventListener("message", this.onMessage);
    this.iframe.removeEventListener("load", this.onLoad);
    this.queue = [];
    const waiters = this.readyWaiters;
    this.readyWaiters = [];
    for (const { reject } of waiters) {
      reject(new Error("ViewerApi: destroyed."));
    }
    for (const { reject, timer } of this.pending.values()) {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
      reject(new Error("ViewerApi: destroyed."));
    }
    this.pending.clear();
  }

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

  /**
   * Runs `task` now if the viewer is ready (or if it is the handshake itself),
   * otherwise buffers it until the next `ready`.
   */
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

  private canReachViewer(): boolean {
    const contentWindow = this.iframe.contentWindow;
    if (contentWindow === null) {
      return false;
    }
    if (this.origin === window.location.origin) {
      return true;
    }
    try {
      void contentWindow.location.href;
      return false;
    } catch {
      return true;
    }
  }

  private post(envelope: Envelope): void {
    if (!this.canReachViewer()) {
      return;
    }
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
    for (const { resolve } of waiters) {
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

  /**
   * Handles inbound viewer messages, obeying only our own viewer: matching
   * origin, our iframe's window, and our namespace plus protocol version.
   */
  private readonly onMessage = (event: MessageEvent): void => {
    if (this.destroyed) return;
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
        if (pending.kind === "state") {
          const state = data as ViewerState;
          this.lastState = state;
          pending.resolve(state);
        } else {
          pending.resolve(data as ViewerCaptured);
        }
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
      case "rendered":
        this.dispatch("rendered", data as ViewerEventMap["rendered"]);
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
