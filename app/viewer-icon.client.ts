/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2InventoryItem } from "@ianlucas/cs2-lib";
import { clientGlobals } from "~/globals";
import { getTypedFromLocalStorage, setToLocalStorage } from "~/local-storage";
import { logError } from "~/shared/monitoring";
import type { ViewerItemInput } from "~/viewer";
import type {
  ViewerApi,
  ViewerCaptureError,
  ViewerUnsupportedReason
} from "~/viewer-api.client";
import { VIEWER_CAPTURE_TIMEOUT_MS } from "~/viewer-api.client";
import {
  ICON_CACHE_VERSION,
  getItemIconKey,
  getViewerIconSlot
} from "~/viewer-icon";
import { requestWebLock } from "~/web-lock.client";

export const VIEWER_ICON_API_CALLS_PER_MINUTE = 30;
export const VIEWER_ICON_API_CALL_BURST = 30;

export const VIEWER_ICON_NETWORK_BACKOFF_BASE_MS = 30_000;
export const VIEWER_ICON_NETWORK_BACKOFF_CAP_MS = 8 * 60_000;

export const VIEWER_ICON_CAPTURE_TIMEOUT_MS = VIEWER_CAPTURE_TIMEOUT_MS;
export const VIEWER_ICON_STARTUP_TIMEOUT_MS = 60_000;
export const VIEWER_ICON_IDLE_TEARDOWN_MS = 30_000;

export const VIEWER_ICON_MAX_ATTEMPTS = 3;
export const VIEWER_ICON_TRANSIENT_RETRY_AFTER_MS = 24 * 60 * 60_000;
export const VIEWER_ICON_ITEM_RETRY_AFTER_MS = 24 * 60 * 60_000;
export const VIEWER_ICON_WEBGL_DISABLE_MS = 6 * 60 * 60_000;

export const VIEWER_ICON_MAX_STORED = 512;
export const VIEWER_ICON_PRUNE_EVERY = 32;
export const VIEWER_ICON_RECENT_LIMIT = 20;

export const VIEWER_ICON_GENERATOR_LOCK =
  "cs2-inventory-simulator:icon-generator";

const MIN_SCHEDULE_MS = 16;

export type ViewerIconError = ViewerCaptureError | "crashed";

export type ViewerIconOutcome =
  "ok" | "interrupted" | "startup-timeout" | ViewerIconError;

export type ViewerIconRole = "idle" | "waiting" | "generator" | "unsupported";

export type ViewerIconDisableReason = "webgl" | "untrusted" | "disabled";

export type ViewerIconCooldownReason = "rate-limit" | "network";

export interface ViewerIconStatus {
  role: ViewerIconRole;
  disabled?: { reason: ViewerIconDisableReason; until?: number };
  paused: { unfocused: boolean; viewers: number };
  generator: {
    host: boolean;
    mounted: boolean;
    ready: boolean;
    generation: number;
    capturing?: string;
  };
  budget: {
    tokens: number;
    cooldownUntil?: number;
    cooldownReason?: ViewerIconCooldownReason;
    networkStep: number;
  };
  queue: {
    key: string;
    uid?: number;
    lane: "edited" | "visible" | "queued";
    attempts: number;
  }[];
  published: number;
  recent: { at: number; key: string; outcome: ViewerIconOutcome }[];
}

export interface ViewerIconEntry {
  key: string;
  image?: Blob;
  error?: ViewerIconError;
  retryAfter?: number;
  usedAt: number;
}

export interface ViewerIconStoreLike {
  read(key: string): Promise<ViewerIconEntry | undefined>;
  writeImage(key: string, image: Blob): Promise<void>;
  writeFailure(
    key: string,
    error: ViewerIconError,
    retryAfter: number
  ): Promise<void>;
  prune(): Promise<void>;
}

const DATABASE_NAME = "cs2-inventory-simulator-icons";
const STORE_NAME = "icons";
const USED_AT_INDEX = "usedAt";

function request<T>(source: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    source.onsuccess = () => resolve(source.result);
    source.onerror = () => reject(source.error ?? new Error("IndexedDB error"));
  });
}

class ViewerIconStore implements ViewerIconStoreLike {
  private database: Promise<IDBDatabase | undefined> | undefined;

  read(key: string) {
    return this.withStore(async (store) => {
      const entry = (await request(store.get(key))) as
        ViewerIconEntry | undefined;
      if (entry !== undefined) {
        store.put({ ...entry, usedAt: Date.now() });
      }
      return entry;
    }, undefined);
  }

  writeImage(key: string, image: Blob) {
    return this.put({ key, image });
  }

  writeFailure(key: string, error: ViewerIconError, retryAfter: number) {
    return this.put({ key, error, retryAfter });
  }

  prune() {
    return this.withStore(async (store) => {
      let excess = (await request(store.count())) - VIEWER_ICON_MAX_STORED;
      if (excess <= 0) {
        return;
      }
      await new Promise<void>((resolve, reject) => {
        const cursorRequest = store.index(USED_AT_INDEX).openCursor();
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (cursor === null || excess <= 0) {
            resolve();
            return;
          }
          cursor.delete();
          excess--;
          cursor.continue();
        };
        cursorRequest.onerror = () =>
          reject(cursorRequest.error ?? new Error("IndexedDB error"));
      });
    }, undefined);
  }

  private put(entry: Omit<ViewerIconEntry, "usedAt">) {
    return this.withStore(async (store) => {
      await request(store.put({ ...entry, usedAt: Date.now() }));
    }, undefined);
  }

  private async withStore<T>(
    run: (store: IDBObjectStore) => Promise<T>,
    fallback: T
  ): Promise<T> {
    const db = await this.open();
    if (db === undefined) {
      return fallback;
    }
    try {
      return await run(
        db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME)
      );
    } catch {
      return fallback;
    }
  }

  private open() {
    this.database ??= new Promise<IDBDatabase | undefined>((resolve) => {
      if (typeof indexedDB === "undefined") {
        resolve(undefined);
        return;
      }
      let opening: IDBOpenDBRequest;
      try {
        opening = indexedDB.open(DATABASE_NAME, ICON_CACHE_VERSION);
      } catch {
        resolve(undefined);
        return;
      }
      opening.onupgradeneeded = () => {
        const db = opening.result;
        if (db.objectStoreNames.contains(STORE_NAME)) {
          db.deleteObjectStore(STORE_NAME);
        }
        const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
        store.createIndex(USED_AT_INDEX, USED_AT_INDEX);
      };
      opening.onsuccess = () => {
        const db = opening.result;
        // Lets a newer ICON_CACHE_VERSION in another tab upgrade instead of
        // being blocked by this connection; the next read reopens.
        db.onversionchange = () => {
          db.close();
          this.database = undefined;
        };
        resolve(db);
      };
      opening.onerror = () => resolve(undefined);
      opening.onblocked = () => resolve(undefined);
    });
    return this.database;
  }
}

function isFailedRecently(stored: ViewerIconEntry | undefined) {
  return (
    stored?.error !== undefined &&
    stored.retryAfter !== undefined &&
    Date.now() < stored.retryAfter
  );
}

const BUDGET_STORAGE_KEY = "inventoryItemIconBudget";

export interface ViewerIconBudgetState {
  tokens: number;
  cooldownUntil: number;
  cooldownReason?: ViewerIconCooldownReason;
  disabledUntil: number;
  networkStep: number;
}

interface StoredBudget extends ViewerIconBudgetState {
  at: number;
}

function isStoredBudget(value: unknown): value is Partial<StoredBudget> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const stored = value as Record<string, unknown>;
  return (
    Number.isFinite(stored.tokens) &&
    Number.isFinite(stored.cooldownUntil) &&
    Number.isFinite(stored.at)
  );
}

function isCooldownReason(value: unknown): value is ViewerIconCooldownReason {
  return value === "rate-limit" || value === "network";
}

export class ViewerIconBudget {
  load(now = Date.now()): ViewerIconBudgetState {
    return this.read(now);
  }

  getWaitMs(now = Date.now()) {
    const { cooldownUntil, tokens } = this.read(now);
    const refill =
      tokens >= 1
        ? 0
        : ((1 - tokens) / VIEWER_ICON_API_CALLS_PER_MINUTE) * 60_000;
    return Math.max(0, cooldownUntil - now, refill);
  }

  spend(apiCalls: number, now = Date.now()) {
    const stored = this.read(now);
    this.write(
      { ...stored, tokens: stored.tokens - Math.max(0, apiCalls) },
      now
    );
  }

  setCooldown(
    forMs: number,
    reason: ViewerIconCooldownReason,
    now = Date.now()
  ) {
    const stored = this.read(now);
    const until = now + Math.max(0, forMs);
    if (until <= stored.cooldownUntil) {
      return;
    }
    this.write(
      { ...stored, cooldownUntil: until, cooldownReason: reason },
      now
    );
  }

  backOffNetwork(now = Date.now()) {
    const { networkStep } = this.read(now);
    const wait = Math.min(
      VIEWER_ICON_NETWORK_BACKOFF_BASE_MS * 2 ** networkStep,
      VIEWER_ICON_NETWORK_BACKOFF_CAP_MS
    );
    this.setCooldown(wait, "network", now);
    const stored = this.read(now);
    this.write({ ...stored, networkStep: networkStep + 1 }, now);
    return wait;
  }

  clearNetworkBackoff(now = Date.now()) {
    const stored = this.read(now);
    if (stored.networkStep !== 0) {
      this.write({ ...stored, networkStep: 0 }, now);
    }
  }

  disable(forMs: number, now = Date.now()) {
    const stored = this.read(now);
    this.write(
      {
        ...stored,
        disabledUntil: Math.max(stored.disabledUntil, now + Math.max(0, forMs))
      },
      now
    );
  }

  private read(now: number): StoredBudget {
    const value = getTypedFromLocalStorage<unknown>(
      BUDGET_STORAGE_KEY,
      undefined
    );
    if (!isStoredBudget(value)) {
      return {
        at: now,
        cooldownUntil: 0,
        disabledUntil: 0,
        networkStep: 0,
        tokens: VIEWER_ICON_API_CALL_BURST
      };
    }
    const at = value.at ?? now;
    const elapsed = Math.max(0, now - at);
    return {
      at,
      cooldownUntil: value.cooldownUntil ?? 0,
      cooldownReason: isCooldownReason(value.cooldownReason)
        ? value.cooldownReason
        : undefined,
      disabledUntil: value.disabledUntil ?? 0,
      networkStep: value.networkStep ?? 0,
      tokens: Math.min(
        VIEWER_ICON_API_CALL_BURST,
        (value.tokens ?? VIEWER_ICON_API_CALL_BURST) +
          (elapsed / 60_000) * VIEWER_ICON_API_CALLS_PER_MINUTE
      )
    };
  }

  private write(stored: StoredBudget, now: number) {
    try {
      setToLocalStorage(
        BUDGET_STORAGE_KEY,
        JSON.stringify({ ...stored, at: now })
      );
    } catch {}
  }
}

class ViewerIconVisibility {
  private readonly slots = new WeakMap<Element, string>();
  private readonly intersecting = new Map<string, Set<Element>>();
  private observer: IntersectionObserver | undefined;

  constructor(private readonly onChange: () => void) {}

  visibleSlots() {
    return this.intersecting.keys();
  }

  observe(slot: string, element: Element) {
    const observer = this.ensureObserver();
    if (observer === undefined) {
      return () => {};
    }
    this.slots.set(element, slot);
    observer.observe(element);
    return () => {
      observer.unobserve(element);
      this.setIntersecting(slot, element, false);
      this.slots.delete(element);
    };
  }

  private ensureObserver() {
    if (typeof IntersectionObserver === "undefined") {
      return undefined;
    }
    this.observer ??= new IntersectionObserver((entries) => {
      let changed = false;
      for (const { target, isIntersecting } of entries) {
        const slot = this.slots.get(target);
        if (
          slot !== undefined &&
          this.setIntersecting(slot, target, isIntersecting)
        ) {
          changed = true;
        }
      }
      if (changed) {
        this.onChange();
      }
    });
    return this.observer;
  }

  private setIntersecting(
    slot: string,
    element: Element,
    isIntersecting: boolean
  ) {
    const elements = this.intersecting.get(slot);
    if (isIntersecting) {
      if (elements === undefined) {
        this.intersecting.set(slot, new Set([element]));
        return true;
      }
      elements.add(element);
      return false;
    }
    if (elements === undefined || !elements.delete(element)) {
      return false;
    }
    if (elements.size > 0) {
      return false;
    }
    this.intersecting.delete(slot);
    return true;
  }
}

interface GeneratorEvents {
  onAcquire(): void;
  onChange(): void;
  onStartupTimeout(): void;
  attach(api: ViewerApi): () => void;
}

export type ViewerIconLock = (
  name: string,
  signal: AbortSignal
) => Promise<(() => void) | undefined>;

// Only the tab the user is on generates, not every tab visible on screen.
function isFocused() {
  return (
    typeof document !== "undefined" &&
    document.visibilityState !== "hidden" &&
    document.hasFocus()
  );
}

class ViewerIconGenerator {
  private role: ViewerIconRole = "idle";
  private mounted = false;
  private generation = 0;
  private seed: ViewerItemInput | undefined;
  private api: ViewerApi | undefined;
  private ready = false;
  private detachApi: (() => void) | undefined;
  private startupTimer: ReturnType<typeof setTimeout> | undefined;
  private hosts = 0;
  private pauses = 0;
  private watching = false;
  private waiting: AbortController | undefined;
  private releaseLock: (() => void) | undefined;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly events: GeneratorEvents,
    private readonly lock: ViewerIconLock
  ) {}

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getMountedGeneration = () => (this.mounted ? this.generation : undefined);

  getSeed() {
    return this.seed;
  }

  getRole() {
    return this.role;
  }

  isMounted() {
    return this.mounted;
  }

  getApi() {
    return this.ready ? this.api : undefined;
  }

  canRun() {
    return this.hosts > 0 && this.pauses === 0 && isFocused();
  }

  getStatus() {
    return {
      paused: { unfocused: !isFocused(), viewers: this.pauses },
      generator: {
        host: this.hosts > 0,
        mounted: this.mounted,
        ready: this.ready,
        generation: this.generation
      }
    };
  }

  /** Whether this tab holds the lock, getting in line for it otherwise. */
  acquire() {
    if (this.role !== "idle") {
      return this.role === "generator";
    }
    const waiting = new AbortController();
    this.role = "waiting";
    this.waiting = waiting;
    void this.lock(VIEWER_ICON_GENERATOR_LOCK, waiting.signal).then(
      (release) => {
        if (waiting.signal.aborted) {
          release?.();
          return;
        }
        this.waiting = undefined;
        this.releaseLock = release;
        if (release === undefined) {
          this.role = "unsupported";
          this.events.onChange();
          return;
        }
        this.role = "generator";
        this.events.onAcquire();
      }
    );
    return false;
  }

  release() {
    if (this.role !== "waiting" && this.role !== "generator") {
      return;
    }
    this.waiting?.abort();
    this.waiting = undefined;
    this.releaseLock?.();
    this.releaseLock = undefined;
    this.role = "idle";
  }

  watchFocus() {
    if (this.watching || typeof document === "undefined") {
      return;
    }
    this.watching = true;
    const onChange = () => this.events.onChange();
    window.addEventListener("focus", onChange);
    window.addEventListener("blur", onChange);
    document.addEventListener("visibilitychange", onChange);
  }

  mount(seed: ViewerItemInput) {
    if (this.mounted) {
      return;
    }
    this.generation++;
    this.mounted = true;
    this.seed = seed;
    this.startStartupTimer();
    this.emit();
  }

  unmount() {
    if (!this.mounted) {
      return;
    }
    this.mounted = false;
    this.seed = undefined;
    this.detach();
    clearTimeout(this.startupTimer);
    this.startupTimer = undefined;
    this.emit();
  }

  setApi(generation: number, api: ViewerApi | undefined) {
    if (!this.mounted || generation !== this.generation) {
      return;
    }
    this.detach();
    if (api === undefined) {
      this.startStartupTimer();
      return;
    }
    this.api = api;
    this.detachApi = this.events.attach(api);
    void api.whenReady().then(
      () => {
        if (this.api !== api) {
          return;
        }
        this.ready = true;
        clearTimeout(this.startupTimer);
        this.startupTimer = undefined;
        this.events.onChange();
      },
      () => {}
    );
  }

  attachHost() {
    return this.hold(
      () => this.hosts++,
      () => this.hosts--
    );
  }

  pause() {
    return this.hold(
      () => this.pauses++,
      () => this.pauses--
    );
  }

  private hold(acquire: () => void, release: () => void) {
    acquire();
    this.events.onChange();
    let released = false;
    return () => {
      if (released) {
        return;
      }
      released = true;
      release();
      this.events.onChange();
    };
  }

  private startStartupTimer() {
    this.startupTimer ??= setTimeout(() => {
      this.startupTimer = undefined;
      this.events.onStartupTimeout();
    }, VIEWER_ICON_STARTUP_TIMEOUT_MS);
  }

  private detach() {
    this.detachApi?.();
    this.detachApi = undefined;
    this.api = undefined;
    this.ready = false;
  }

  private emit() {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

interface Pending {
  key: string;
  item: ViewerItemInput;
  uid?: number;
  priority: boolean;
  attempts: number;
}

interface Slot {
  key: string;
  previousKey?: string;
}

interface CaptureOutcome {
  apiCalls: number;
  image?: Blob;
  error?: ViewerIconError | "interrupted";
}

interface Inflight {
  entry: Pending;
  interrupt: (outcome: CaptureOutcome) => void;
}

export interface ViewerIconsOptions {
  store?: ViewerIconStoreLike;
  budget?: ViewerIconBudget;
  lock?: ViewerIconLock;
}

export class ViewerIcons {
  private readonly store: ViewerIconStoreLike;
  private readonly budget: ViewerIconBudget;
  private readonly visibility: ViewerIconVisibility;
  private readonly generator: ViewerIconGenerator;
  private readonly pending = new Map<string, Pending>();
  private readonly known = new Set<string>();
  private readonly failed = new Set<string>();
  private readonly urls = new Map<string, string>();
  private readonly slots = new Map<string, Slot>();
  private readonly listeners = new Map<string, Set<() => void>>();
  private readonly recent: ViewerIconStatus["recent"] = [];
  private disabledForSession: "untrusted" | "disabled" | undefined;
  private inflight: Inflight | undefined;
  private takingOver = 0;
  private pumpTimer: ReturnType<typeof setTimeout> | undefined;
  private teardownTimer: ReturnType<typeof setTimeout> | undefined;
  private writes = 0;

  constructor({
    store = new ViewerIconStore(),
    budget = new ViewerIconBudget(),
    lock = requestWebLock
  }: ViewerIconsOptions = {}) {
    this.store = store;
    this.budget = budget;
    this.visibility = new ViewerIconVisibility(() => this.pump());
    this.generator = new ViewerIconGenerator(
      {
        attach: (api) => this.attach(api),
        onAcquire: () => void this.takeOver(),
        onChange: () => this.pump(),
        onStartupTimeout: () => this.onStartupTimeout()
      },
      lock
    );
  }

  subscribe(slot: string, listener: () => void) {
    let entry = this.listeners.get(slot);
    if (entry === undefined) {
      entry = new Set();
      this.listeners.set(slot, entry);
    }
    entry.add(listener);
    return () => {
      entry.delete(listener);
      if (entry.size === 0) {
        this.listeners.delete(slot);
      }
    };
  }

  getUrl(slot: string) {
    const current = this.slots.get(slot);
    if (current === undefined) {
      return undefined;
    }
    return (
      this.urls.get(current.key) ??
      (current.previousKey === undefined
        ? undefined
        : this.urls.get(current.previousKey))
    );
  }

  observe(slot: string, element: Element) {
    return this.visibility.observe(slot, element);
  }

  request(item: ViewerItemInput, slotId = getViewerIconSlot(item)) {
    const key = getItemIconKey(item);
    const slot = this.slots.get(slotId);
    const edited = slot !== undefined && slot.key !== key;
    if (slot === undefined) {
      this.slots.set(slotId, { key });
      this.notify(slotId);
    } else if (edited) {
      const replaced = [slot.key, slot.previousKey];
      slot.previousKey = this.urls.has(key)
        ? undefined
        : this.urls.has(slot.key)
          ? slot.key
          : slot.previousKey;
      slot.key = key;
      for (const old of replaced) {
        if (old !== undefined) {
          this.releaseIfUnused(old);
        }
      }
      this.notify(slotId);
    }
    if (this.known.has(key)) {
      const queued = this.pending.get(key);
      if (edited && queued !== undefined) {
        queued.priority = true;
      }
      return;
    }
    this.known.add(key);
    void this.load(key, item, edited);
  }

  subscribeGenerator = (listener: () => void) =>
    this.generator.subscribe(listener);

  getMountedGeneration = () => this.generator.getMountedGeneration();

  getSeed() {
    return this.generator.getSeed();
  }

  setApi(generation: number, api: ViewerApi | undefined) {
    this.generator.setApi(generation, api);
  }

  attachHost() {
    return this.generator.attachHost();
  }

  pause() {
    return this.generator.pause();
  }

  getStatus(): ViewerIconStatus {
    const now = Date.now();
    const { cooldownReason, cooldownUntil, networkStep, tokens } =
      this.budget.load(now);
    const { generator, paused } = this.generator.getStatus();
    return {
      role: this.generator.getRole(),
      disabled: this.getDisabled(now),
      paused,
      generator: { ...generator, capturing: this.inflight?.entry.key },
      budget: {
        tokens,
        networkStep,
        ...(now < cooldownUntil ? { cooldownUntil, cooldownReason } : {})
      },
      queue: Array.from(this.pending.values(), (entry) => ({
        key: entry.key,
        uid: entry.uid,
        lane: entry.priority
          ? "edited"
          : this.isVisible(entry.key)
            ? "visible"
            : "queued",
        attempts: entry.attempts
      })),
      published: this.urls.size,
      recent: [...this.recent]
    };
  }

  private async load(key: string, item: ViewerItemInput, priority: boolean) {
    const stored = await this.store.read(key);
    if (!this.known.has(key)) {
      return;
    }
    if (stored?.image !== undefined) {
      this.publish(key, stored.image);
      return;
    }
    if (
      isFailedRecently(stored) ||
      this.isDisabled() ||
      this.generator.getRole() === "unsupported"
    ) {
      this.fail(key);
      return;
    }
    this.generator.watchFocus();
    this.pending.set(key, {
      attempts: 0,
      item,
      key,
      priority,
      uid: item instanceof CS2InventoryItem ? item.uid : undefined
    });
    this.pump();
  }

  private pump() {
    clearTimeout(this.pumpTimer);
    this.pumpTimer = undefined;
    const disabled =
      this.generator.getRole() === "unsupported" || this.isDisabled();
    if (disabled || !this.generator.canRun()) {
      this.stop();
      if (disabled) {
        this.abandonPending();
      }
      // Holds on until the capture in flight settles, so the tab taking over
      // finds whatever it stores.
      if (this.inflight === undefined) {
        this.generator.release();
      }
      return;
    }
    if (this.inflight !== undefined || this.takingOver > 0) {
      return;
    }
    const next = this.pickNext();
    if (next === undefined) {
      this.generator.release();
      this.scheduleTeardown();
      return;
    }
    if (!this.generator.acquire()) {
      return;
    }
    const wait = this.budget.getWaitMs();
    if (wait > 0) {
      this.scheduleTeardown();
      this.schedule(wait);
      return;
    }
    this.cancelTeardown();
    this.generator.mount(next.item);
    const api = this.generator.getApi();
    if (api !== undefined) {
      void this.run(api, next);
    }
  }

  private pickNext() {
    let edited: Pending | undefined;
    let visible: Pending | undefined;
    let queued: Pending | undefined;
    for (const entry of this.pending.values()) {
      if (entry.priority) {
        edited = entry;
        continue;
      }
      if (visible === undefined && this.isVisible(entry.key)) {
        visible = entry;
      }
      queued ??= entry;
    }
    return edited ?? visible ?? queued;
  }

  private isVisible(key: string) {
    for (const slot of this.visibility.visibleSlots()) {
      if (this.slots.get(slot)?.key === key) {
        return true;
      }
    }
    return false;
  }

  private requeue(entry: Pending) {
    if (this.pending.delete(entry.key)) {
      this.pending.set(entry.key, entry);
    }
  }

  private abandonPending() {
    const abandoned = Array.from(this.pending.keys());
    this.pending.clear();
    for (const key of abandoned) {
      this.fail(key);
    }
  }

  private async run(api: ViewerApi, entry: Pending) {
    let interrupt: (outcome: CaptureOutcome) => void = () => {};
    const interrupted = new Promise<CaptureOutcome>((resolve) => {
      interrupt = resolve;
    });
    this.inflight = { entry, interrupt };
    let outcome: CaptureOutcome;
    try {
      outcome = await Promise.race([
        api.capture(entry.item, { timeoutMs: VIEWER_ICON_CAPTURE_TIMEOUT_MS }),
        interrupted
      ]);
    } catch {
      outcome = {
        apiCalls: 1,
        error: this.generator.getApi() === api ? "crashed" : "interrupted"
      };
    }
    try {
      await this.settle(api, entry, outcome);
    } finally {
      this.inflight = undefined;
      this.pump();
    }
  }

  // Another tab may have drawn, or given up on, what this one waited on. Tabs
  // only store icons while holding the lock, so checking once is enough.
  private async takeOver() {
    this.takingOver++;
    await Promise.all(
      Array.from(this.pending.values(), async (entry) => {
        const stored = await this.store.read(entry.key);
        if (this.pending.get(entry.key) !== entry) {
          return;
        }
        if (stored?.image !== undefined) {
          this.pending.delete(entry.key);
          this.publish(entry.key, stored.image);
        } else if (isFailedRecently(stored)) {
          this.pending.delete(entry.key);
          this.fail(entry.key);
        }
      })
    );
    this.takingOver--;
    this.pump();
  }

  private async settle(
    api: ViewerApi,
    entry: Pending,
    { apiCalls, error = "crashed", image }: CaptureOutcome
  ) {
    this.budget.spend(apiCalls);
    this.record(entry.key, image !== undefined ? "ok" : error);
    if (image !== undefined) {
      this.budget.clearNetworkBackoff();
      await this.write(() => this.store.writeImage(entry.key, image));
      this.pending.delete(entry.key);
      this.publish(entry.key, image);
      return;
    }
    switch (error) {
      case "interrupted":
        this.requeue(entry);
        return;
      case "webgl":
        this.disable("webgl");
        return;
      case "untrusted":
      case "disabled":
        logError(
          `[InventorySimulator] 3D inventory icons disabled: the viewer refused to capture (${error}).`
        );
        this.disable(error);
        return;
      case "network":
      case "asset":
        this.budget.backOffNetwork();
        this.recycle(api);
        this.requeue(entry);
        return;
      case "weapon":
      case "sticker":
      case "keychain":
      case "patch":
        logError(
          `[InventorySimulator] The 3D viewer could not render an item's icon (${error}).`,
          { extra: { key: entry.key } }
        );
        await this.giveUp(entry, error, VIEWER_ICON_ITEM_RETRY_AFTER_MS);
        return;
      default:
        entry.attempts++;
        this.recycle(api);
        if (entry.attempts < VIEWER_ICON_MAX_ATTEMPTS) {
          this.requeue(entry);
          return;
        }
        logError(
          `[InventorySimulator] The 3D viewer gave up on an item's icon (${error}).`,
          { extra: { key: entry.key } }
        );
        await this.giveUp(entry, error, VIEWER_ICON_TRANSIENT_RETRY_AFTER_MS);
    }
  }

  private async giveUp(
    entry: Pending,
    error: ViewerIconError,
    retryAfterMs: number
  ) {
    this.pending.delete(entry.key);
    this.fail(entry.key);
    await this.write(() =>
      this.store.writeFailure(entry.key, error, Date.now() + retryAfterMs)
    );
  }

  private async write(writing: () => Promise<void>) {
    await writing();
    this.writes++;
    if (this.writes % VIEWER_ICON_PRUNE_EVERY === 0) {
      await this.store.prune();
    }
  }

  private attach(api: ViewerApi) {
    const offRateLimited = api.on("rateLimited", ({ retryAfterMs }) => {
      this.budget.setCooldown(retryAfterMs, "rate-limit");
      this.pump();
    });
    const offUnsupported = api.on("unsupported", ({ reason }) =>
      this.onUnsupported(api, reason)
    );
    return () => {
      offRateLimited();
      offUnsupported();
    };
  }

  private onUnsupported(api: ViewerApi, reason: ViewerUnsupportedReason) {
    switch (reason) {
      case "webgl":
        this.disable("webgl");
        return;
      case "network":
      case "asset":
        if (this.inflight !== undefined) {
          this.inflight.interrupt({ apiCalls: 1, error: reason });
          return;
        }
        this.budget.backOffNetwork();
        this.recycle(api);
        this.pump();
        return;
      default:
      // An item reason out of band is about the item the viewer booted with;
      // a capture's own item errors arrive on its reply.
    }
  }

  private onStartupTimeout() {
    const seed = this.generator.getSeed();
    this.record(
      seed === undefined ? "" : getItemIconKey(seed),
      "startup-timeout"
    );
    this.budget.backOffNetwork();
    this.generator.unmount();
    this.pump();
  }

  private recycle(failed: ViewerApi) {
    if (this.generator.getApi() === failed) {
      this.generator.unmount();
    }
  }

  private stop() {
    this.inflight?.interrupt({ apiCalls: 1, error: "interrupted" });
    this.cancelTeardown();
    this.generator.unmount();
  }

  private schedule(delayMs: number) {
    clearTimeout(this.pumpTimer);
    this.pumpTimer = setTimeout(
      () => {
        this.pumpTimer = undefined;
        this.pump();
      },
      Math.max(MIN_SCHEDULE_MS, delayMs)
    );
  }

  private scheduleTeardown() {
    if (this.teardownTimer !== undefined || !this.generator.isMounted()) {
      return;
    }
    this.teardownTimer = setTimeout(() => {
      this.teardownTimer = undefined;
      this.generator.unmount();
    }, VIEWER_ICON_IDLE_TEARDOWN_MS);
  }

  private cancelTeardown() {
    clearTimeout(this.teardownTimer);
    this.teardownTimer = undefined;
  }

  private getDisabled(now = Date.now()): ViewerIconStatus["disabled"] {
    if (this.disabledForSession !== undefined) {
      return { reason: this.disabledForSession };
    }
    const { disabledUntil } = this.budget.load(now);
    return now < disabledUntil
      ? { reason: "webgl", until: disabledUntil }
      : undefined;
  }

  private isDisabled() {
    return this.getDisabled() !== undefined;
  }

  private disable(reason: ViewerIconDisableReason) {
    if (reason === "webgl") {
      this.budget.disable(VIEWER_ICON_WEBGL_DISABLE_MS);
    } else {
      this.disabledForSession = reason;
    }
    this.stop();
    this.abandonPending();
  }

  private publish(key: string, image: Blob) {
    if (!this.isReferenced(key)) {
      this.known.delete(key);
      return;
    }
    const stale = this.urls.get(key);
    if (stale !== undefined) {
      URL.revokeObjectURL(stale);
    }
    this.urls.set(key, URL.createObjectURL(image));
    this.failed.delete(key);
    this.handOver(key);
  }

  private fail(key: string) {
    this.failed.add(key);
    this.handOver(key);
  }

  private handOver(key: string) {
    const replaced = new Set<string>();
    for (const [slotId, slot] of this.slots) {
      if (slot.key !== key) {
        continue;
      }
      if (slot.previousKey !== undefined) {
        replaced.add(slot.previousKey);
        slot.previousKey = undefined;
      }
      this.notify(slotId);
    }
    for (const old of replaced) {
      this.releaseIfUnused(old);
    }
  }

  private isReferenced(key: string) {
    for (const slot of this.slots.values()) {
      if (slot.key === key || slot.previousKey === key) {
        return true;
      }
    }
    return false;
  }

  private releaseIfUnused(key: string) {
    if (this.isReferenced(key)) {
      return;
    }
    const url = this.urls.get(key);
    if (url !== undefined) {
      URL.revokeObjectURL(url);
      this.urls.delete(key);
    }
    this.pending.delete(key);
    this.known.delete(key);
    this.failed.delete(key);
  }

  private notify(slot: string) {
    for (const listener of this.listeners.get(slot) ?? []) {
      listener();
    }
  }

  private record(key: string, outcome: ViewerIconOutcome) {
    this.recent.push({ at: Date.now(), key, outcome });
    if (this.recent.length > VIEWER_ICON_RECENT_LIMIT) {
      this.recent.shift();
    }
  }
}

export const viewerIcons = new ViewerIcons();

clientGlobals.getViewerIconStatus = () => viewerIcons.getStatus();
