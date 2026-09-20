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
import { claimTabLock } from "./tab-leader";
import type { ViewerApi } from "./viewer-api";

export const ICON_CAPTURE_TIMEOUT_MS = 45_000;
export const ICON_IDLE_TEARDOWN_MS = 30_000;
export const ICON_GENERATOR_LOCK = "cs2-inventory-simulator:icon-generator";

const PRUNE_EVERY = 32;
const PERMANENT_ITEM_ERRORS = new Set(["weapon", "sticker", "keychain"]);
const UNSUPPORTED_ITEM_REASONS = new Set(["weapon", "sticker", "keychain"]);
const SESSION_ERRORS = new Set(["untrusted", "disabled"]);
const MAX_ATTEMPTS = 3;

type GeneratorRole = "unclaimed" | "claiming" | "generator" | "bystander";

interface Pending {
  key: string;
  item: ViewerItemInput;
  elements: Set<Element>;
  priority: boolean;
  visible: boolean;
  attempts: number;
}

interface CaptureOutcome {
  apiCalls: number;
  error?: string;
  image?: Blob;
}

const urls = new Map<string, string>();
const pending = new Map<string, Pending>();
const known = new Set<string>();
const unavailable = new Set<string>();
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
let role: GeneratorRole = "unclaimed";
let resumeWhenVisible: (() => void) | undefined;
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

export function getIconUrl(key: string): string | undefined {
  return urls.get(key);
}

export function getIconUrlServer(): undefined {
  return undefined;
}

export function isIconUnavailable(key: string): boolean {
  return unavailable.has(key);
}

export function isIconUnavailableServer(): boolean {
  return false;
}

function markIconUnavailable(key: string): void {
  unavailable.add(key);
  notify(key);
}

function abandonPendingIcons(): void {
  const abandoned = Array.from(pending.keys());
  pending.clear();
  for (const key of abandoned) {
    markIconUnavailable(key);
  }
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

export function disableIconGeneration(): void {
  disabled = true;
  abandonPendingIcons();
  setWanted(false);
}

export function isIconGenerationDisabled(): boolean {
  return disabled;
}

export function pauseIconGeneration(): () => void {
  paused++;
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

function pauseWhileTabIsHidden(): void {
  if (typeof document === "undefined") {
    return;
  }
  function syncWithVisibility(): void {
    if (document.visibilityState === "hidden") {
      resumeWhenVisible ??= pauseIconGeneration();
      return;
    }
    const resume = resumeWhenVisible;
    resumeWhenVisible = undefined;
    resume?.();
  }
  document.addEventListener("visibilitychange", syncWithVisibility);
  syncWithVisibility();
}

function claimIconGeneratorRole(): void {
  if (role !== "unclaimed") {
    return;
  }
  role = "claiming";
  void claimTabLock(ICON_GENERATOR_LOCK).then((granted) => {
    role = granted ? "generator" : "bystander";
    if (!granted) {
      abandonPendingIcons();
      setWanted(false);
      return;
    }
    pauseWhileTabIsHidden();
    pump();
  });
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
    setWanted(false);
  }, ICON_IDLE_TEARDOWN_MS);
}

function cancelTeardown(): void {
  if (teardownTimer !== undefined) {
    clearTimeout(teardownTimer);
    teardownTimer = undefined;
  }
}

function pickNext(): Pending | undefined {
  let newestPrioritized: Pending | undefined;
  let firstVisible: Pending | undefined;
  let firstQueued: Pending | undefined;
  for (const entry of pending.values()) {
    if (entry.priority) {
      newestPrioritized = entry;
      continue;
    }
    if (entry.visible) {
      firstVisible ??= entry;
    }
    firstQueued ??= entry;
  }
  return newestPrioritized ?? firstVisible ?? firstQueued;
}

function settle(key: string, image: Blob | undefined): void {
  pending.delete(key);
  if (image !== undefined) {
    urls.set(key, URL.createObjectURL(image));
  } else {
    unavailable.add(key);
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
      new Promise<CaptureOutcome>((resolve) => {
        failInflight = (error) => resolve({ apiCalls: 1, error });
      })
    ]);
    spendIconBudget(captured.apiCalls);
    if (captured.error !== undefined && SESSION_ERRORS.has(captured.error)) {
      console.error(
        `[InventorySimulator] 3D inventory icons disabled: the viewer refused to capture (${captured.error}). `
      );
      disableIconGeneration();
      return;
    }
    await record(entry.key, captured);
    settle(entry.key, captured.image);
  } catch {
    entry.attempts++;
    spendIconBudget(1);
    if (entry.attempts < MAX_ATTEMPTS) {
      pending.delete(entry.key);
      pending.set(entry.key, entry);
    } else {
      pending.delete(entry.key);
      markIconUnavailable(entry.key);
    }
  } finally {
    failInflight = undefined;
    running = false;
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
  if (disabled || running || paused > 0 || role !== "generator") {
    return;
  }
  const next = pickNext();
  if (next === undefined) {
    scheduleTeardown();
    return;
  }
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
  const generator = api;
  if (generator === undefined) {
    return;
  }
  void run(generator, next);
}

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

export async function requestIcon(
  key: string,
  item: ViewerItemInput,
  { priority = false }: { priority?: boolean } = {}
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
    markIconUnavailable(key);
    return;
  }
  if (disabled || role === "bystander") {
    markIconUnavailable(key);
    return;
  }
  claimIconGeneratorRole();
  pending.set(key, {
    attempts: 0,
    elements: new Set(),
    item,
    key,
    priority,
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
