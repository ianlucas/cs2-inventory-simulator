/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ViewerItemInput } from "~/data/viewer";
import {
  ICON_API_CALLS_PER_MINUTE,
  loadIconBudget,
  setIconBudgetCooldown,
  spendIconBudget
} from "./item-icon-budget";
import {
  pruneIcons,
  readIcon,
  writeIcon,
  writeIconFailure
} from "./item-icon-store";
import type { ViewerApi } from "./viewer-api";

/** Bounds a capture whose iframe the browser throttled into never settling. */
export const ICON_CAPTURE_TIMEOUT_MS = 45_000;
export const ICON_IDLE_TEARDOWN_MS = 30_000;

/** Prunes on a multiple of writes rather than every one, which would double the write traffic. */
const PRUNE_EVERY = 32;

/**
 * Failures that describe the item and will repeat for it forever, so they are
 * remembered. Everything else describes a moment and is retried next session.
 */
const PERMANENT_ITEM_ERRORS = new Set(["weapon", "sticker", "keychain"]);

/**
 * Reasons the viewer reports out-of-band, through `unsupported`, for an item it
 * turns out it cannot draw. They name the same failures as a capture's own
 * `error`, so they are treated the same way once routed to the capture.
 */
const UNSUPPORTED_ITEM_REASONS = new Set(["weapon", "sticker", "keychain"]);

/**
 * Failures that are about the deployment rather than any item: an untrusted
 * session (whose frames carry a watermark) or an iframe that lost its capture
 * flag. Retrying per item would just spend the budget discovering the same
 * thing 256 times.
 */
const SESSION_ERRORS = new Set(["untrusted", "disabled"]);

/**
 * How many times a capture that never answered is retried before the item is
 * left on its flat image for the session.
 *
 * A capture dies whenever the generator goes away under it, which a user does
 * simply by opening the inspector. Dropping the item on the first of those
 * would mean the items someone looks at are the least likely to get an icon.
 */
const MAX_ATTEMPTS = 3;

interface Pending {
  key: string;
  item: ViewerItemInput;
  elements: Set<Element>;
  visible: boolean;
  attempts: number;
}

/** What a capture produced, narrowed to what the queue acts on. */
interface CaptureOutcome {
  apiCalls: number;
  error?: string;
  image?: Blob;
}

const urls = new Map<string, string>();
const pending = new Map<string, Pending>();
const known = new Set<string>();
const listeners = new Map<string, Set<() => void>>();
const wantedListeners = new Set<() => void>();
const elementKeys = new WeakMap<Element, string>();

let api: ViewerApi | undefined;
let unsubscribeApi: (() => void) | undefined;
let disabled = false;
let paused = 0;
let running = false;
let wanted = false;
let writes = 0;
let failInflight: ((reason: string) => void) | undefined;
let pumpTimer: ReturnType<typeof setTimeout> | undefined;
let teardownTimer: ReturnType<typeof setTimeout> | undefined;
let observer: IntersectionObserver | undefined;

function notify(key: string): void {
  for (const listener of listeners.get(key) ?? []) {
    listener();
  }
}

function setWanted(next: boolean): void {
  if (wanted === next) {
    return;
  }
  wanted = next;
  for (const listener of wantedListeners) {
    listener();
  }
}

/** Whether a generator iframe should be mounted right now. */
export function isIconGeneratorWanted(): boolean {
  return wanted;
}

export function isIconGeneratorWantedServer(): boolean {
  return false;
}

export function subscribeIconGeneratorWanted(listener: () => void): () => void {
  wantedListeners.add(listener);
  return () => wantedListeners.delete(listener);
}

/** Reads a generated icon's object URL, if this session has one. */
export function getIconUrl(key: string): string | undefined {
  return urls.get(key);
}

export function getIconUrlServer(): undefined {
  return undefined;
}

export function subscribeIcon(key: string, listener: () => void): () => void {
  let entry = listeners.get(key);
  if (entry === undefined) {
    entry = new Set();
    listeners.set(key, entry);
  }
  entry.add(listener);
  return () => {
    entry.delete(listener);
    if (entry.size === 0) {
      listeners.delete(key);
    }
  };
}

/**
 * Stops generating for the rest of the session.
 *
 * Used for the failures that no amount of budget resolves: no WebGL on this
 * device, or a viewer that will not hand back an unwatermarked frame.
 */
export function disableIconGeneration(): void {
  disabled = true;
  pending.clear();
  setWanted(false);
}

export function isIconGenerationDisabled(): boolean {
  return disabled;
}

/**
 * Suspends background generation while an interactive viewer is on screen, and
 * resumes on the returned call.
 *
 * The two draw from one per-IP budget and one GPU, and only one of them is
 * something the user is waiting on.
 */
export function pauseIconGeneration(): () => void {
  paused++;
  // A capture in flight keeps its generator until it lands. Tearing the iframe
  // down here destroys that capture, and since visible items are generated
  // first, the item being paused *for* is usually the one in flight -- opening
  // the inspector on a tile would reliably destroy that tile's own icon.
  if (!running) {
    setWanted(false);
  }
  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    paused--;
    pump();
  };
}

function schedule(delayMs: number): void {
  if (pumpTimer !== undefined) {
    clearTimeout(pumpTimer);
  }
  pumpTimer = setTimeout(
    () => {
      pumpTimer = undefined;
      pump();
    },
    Math.max(16, delayMs)
  );
}

function scheduleTeardown(): void {
  if (teardownTimer !== undefined) {
    return;
  }
  teardownTimer = setTimeout(() => {
    teardownTimer = undefined;
    // Unconditional: the next pump mounts a generator again the moment it has
    // both work and the budget to do it, so holding one here only keeps a
    // context warm for a wait that has already outlasted the idle window.
    setWanted(false);
  }, ICON_IDLE_TEARDOWN_MS);
}

function cancelTeardown(): void {
  if (teardownTimer !== undefined) {
    clearTimeout(teardownTimer);
    teardownTimer = undefined;
  }
}

/** Spends the budget on what the user is looking at before what they scrolled past. */
function pickNext(): Pending | undefined {
  let fallback: Pending | undefined;
  for (const entry of pending.values()) {
    if (entry.visible) {
      return entry;
    }
    fallback ??= entry;
  }
  return fallback;
}

function settle(key: string, image: Blob | undefined): void {
  pending.delete(key);
  if (image !== undefined) {
    urls.set(key, URL.createObjectURL(image));
  }
  notify(key);
}

async function record(key: string, captured: { image?: Blob; error?: string }) {
  if (captured.image !== undefined) {
    await writeIcon(key, captured.image);
    writes++;
    if (writes % PRUNE_EVERY === 0) {
      await pruneIcons();
    }
    return;
  }
  if (
    captured.error !== undefined &&
    PERMANENT_ITEM_ERRORS.has(captured.error)
  ) {
    await writeIconFailure(key, captured.error);
  }
}

async function run(generator: ViewerApi, entry: Pending): Promise<void> {
  running = true;
  try {
    const captured: CaptureOutcome = await Promise.race([
      generator.capture(entry.item, { timeoutMs: ICON_CAPTURE_TIMEOUT_MS }),
      // The viewer discovers some failures while loading assets rather than
      // while answering, and reports those through `unsupported` instead of
      // replying. Without this the capture waits out its whole timeout and is
      // then retried on every future visit, because a timeout is not written
      // off the way the underlying reason would be.
      new Promise<CaptureOutcome>((resolve) => {
        failInflight = (error) => resolve({ apiCalls: 1, error });
      })
    ]);
    // Reported rather than estimated: the viewer's recipe cache makes the cost
    // of an item unknowable from the item.
    spendIconBudget(captured.apiCalls);
    if (captured.error !== undefined && SESSION_ERRORS.has(captured.error)) {
      // Loud, because the alternative is indistinguishable from the feature not
      // existing: the tiles keep the flat image they were already showing and
      // the generator quietly unmounts.
      console.error(
        `[InventorySimulator] 3D inventory icons disabled: the viewer refused to capture (${captured.error}). ` +
          "An untrusted session means the viewer put this origin on the public tier, where frames carry a " +
          "watermark. Locally, run the viewer with `npm run dev` rather than `npm start` -- it only trusts " +
          "localhost outside production -- or give this app a viewerKey the viewer accepts for this origin."
      );
      disableIconGeneration();
      return;
    }
    await record(entry.key, captured);
    settle(entry.key, captured.image);
  } catch {
    // A timed-out or destroyed capture is about this moment, not this item, so
    // nothing is written: a retry now, and failing that the next session --
    // with a warm recipe cache and no record of the failure -- starts over.
    entry.attempts++;
    spendIconBudget(1);
    if (entry.attempts < MAX_ATTEMPTS) {
      // Re-queued at the back, so one unlucky item cannot hold up the rest.
      pending.delete(entry.key);
      pending.set(entry.key, entry);
    } else {
      pending.delete(entry.key);
      notify(entry.key);
    }
  } finally {
    failInflight = undefined;
    running = false;
    // A pause that arrived mid-capture left the generator up on purpose; now
    // that the capture has landed, it can go.
    if (paused > 0) {
      setWanted(false);
    }
    pump();
  }
}

function pump(): void {
  if (pumpTimer !== undefined) {
    clearTimeout(pumpTimer);
    pumpTimer = undefined;
  }
  if (disabled || running || paused > 0) {
    return;
  }
  const next = pickNext();
  if (next === undefined) {
    scheduleTeardown();
    return;
  }
  // The budget is checked before the iframe is asked for, so a queue that has
  // work but cannot spend anything on it does not stand up a viewer to watch
  // the clock: booting one costs a WebGL context and the asset downloads for
  // whatever it draws first.
  const now = Date.now();
  const { cooldownUntil, tokens } = loadIconBudget(now);
  if (now < cooldownUntil) {
    scheduleTeardown();
    schedule(cooldownUntil - now);
    return;
  }
  if (tokens < 1) {
    scheduleTeardown();
    schedule(((1 - tokens) / ICON_API_CALLS_PER_MINUTE) * 60_000);
    return;
  }
  cancelTeardown();
  setWanted(true);
  // The generator iframe mounts asynchronously; its api pumps again on arrival.
  const generator = api;
  if (generator === undefined) {
    return;
  }
  void run(generator, next);
}

/** Connects the generator iframe's api, or drops it when the iframe goes away. */
export function setIconGeneratorApi(next: ViewerApi | undefined): void {
  unsubscribeApi?.();
  unsubscribeApi = undefined;
  api = next;
  if (next !== undefined) {
    const offRateLimited = next.on("rateLimited", ({ retryAfterMs }) => {
      setIconBudgetCooldown(retryAfterMs);
      schedule(retryAfterMs);
    });
    const offUnsupported = next.on("unsupported", ({ reason }) => {
      if (reason === "webgl") {
        disableIconGeneration();
        return;
      }
      if (UNSUPPORTED_ITEM_REASONS.has(reason)) {
        failInflight?.(reason);
      }
    });
    unsubscribeApi = () => {
      offRateLimited();
      offUnsupported();
    };
  }
  pump();
}

/**
 * Queues `item` for generation unless this session already answered for it.
 *
 * Resolves the cache first, so a reload costs a read rather than a render.
 */
export async function requestIcon(
  key: string,
  item: ViewerItemInput
): Promise<void> {
  if (disabled || urls.has(key) || known.has(key) || pending.has(key)) {
    return;
  }
  known.add(key);
  const entry = await readIcon(key);
  if (entry?.image !== undefined) {
    urls.set(key, URL.createObjectURL(entry.image));
    notify(key);
    return;
  }
  if (entry?.error !== undefined) {
    return;
  }
  if (disabled) {
    return;
  }
  pending.set(key, {
    attempts: 0,
    elements: new Set(),
    item,
    key,
    visible: false
  });
  pump();
}

function ensureObserver(): IntersectionObserver | undefined {
  if (typeof IntersectionObserver === "undefined") {
    return undefined;
  }
  observer ??= new IntersectionObserver((entries) => {
    let changed = false;
    for (const { target, isIntersecting } of entries) {
      const key = elementKeys.get(target);
      const entry = key === undefined ? undefined : pending.get(key);
      if (entry !== undefined && entry.visible !== isIntersecting) {
        entry.visible = isIntersecting;
        changed = true;
      }
    }
    if (changed) {
      pump();
    }
  });
  return observer;
}

/** Tracks a tile's visibility so on-screen items are generated first. */
export function observeIconTile(key: string, element: Element): () => void {
  const active = ensureObserver();
  if (active === undefined) {
    return () => {};
  }
  elementKeys.set(element, key);
  pending.get(key)?.elements.add(element);
  active.observe(element);
  return () => {
    active.unobserve(element);
    pending.get(key)?.elements.delete(element);
  };
}
