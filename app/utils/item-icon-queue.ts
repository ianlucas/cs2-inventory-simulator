/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ViewerItemInput } from "~/data/viewer";
import {
  ICON_API_CALLS_PER_MINUTE,
  backOffIconNetwork,
  clearIconNetworkBackoff,
  disableIconBudget,
  loadIconBudget,
  setIconBudgetCooldown,
  spendIconBudget
} from "./item-icon-budget";
import {
  IconGeneratorRole,
  claimIconGeneratorRole,
  getIconGeneratorRole,
  isIconGenerationPaused,
  setIconGeneratorWanted,
  subscribeIconGeneratorRole
} from "./item-icon-generator-role";
import {
  hasIcon,
  markIconUnavailable,
  publishIcon,
  releaseIcon,
  retractIconUnavailable
} from "./item-icon-registry";
import {
  IconEntry,
  deleteIcon,
  pruneIcons,
  readIcon,
  writeIcon,
  writeIconFailure
} from "./item-icon-store";
import {
  isIconTileVisible,
  subscribeIconTileVisibility
} from "./item-icon-visibility";
import { VIEWER_CAPTURE_TIMEOUT_MS } from "./viewer-api";
import type {
  ViewerApi,
  ViewerCaptureError,
  ViewerCaptured
} from "./viewer-api";

export const ICON_CAPTURE_TIMEOUT_MS = VIEWER_CAPTURE_TIMEOUT_MS;
export const ICON_IDLE_TEARDOWN_MS = 30_000;

const PRUNE_EVERY = 32;
const MAX_ATTEMPTS = 3;

const ITEM_ERRORS: ReadonlySet<ViewerCaptureError> = new Set([
  "weapon",
  "sticker",
  "keychain",
  "patch"
]);

const SESSION_ERRORS: ReadonlySet<ViewerCaptureError> = new Set([
  "untrusted",
  "disabled"
]);

const NETWORK_ERRORS: ReadonlySet<ViewerCaptureError> = new Set([
  "network",
  "asset"
]);

const TRANSIENT_RETRY_AFTER_MS = 24 * 60 * 60_000;
const WEBGL_DISABLE_MS = 6 * 60 * 60_000;
const DEPLOYMENT_DISABLE_MS = 24 * 60 * 60_000;
const GENERATOR_STARTUP_TIMEOUT_MS = 60_000;
const GENERATOR_STARTUP_POLL_MS = 1_000;
const GENERATOR_RETRY_MS = 60_000;

interface Pending {
  key: string;
  item: ViewerItemInput;
  priority: boolean;
  attempts: number;
}

type CaptureOutcome = Omit<ViewerCaptured, "item">;

const pending = new Map<string, Pending>();
const known = new Set<string>();
const deferred = new Map<string, ViewerItemInput>();
const discarded = new Set<string>();

let api: ViewerApi | undefined;
let unsubscribeApi: (() => void) | undefined;
let disabled = false;
let disabledUntil: number | undefined;
let running = false;
let writes = 0;
let lastRole: IconGeneratorRole = "unclaimed";
let failInflight: ((error: ViewerCaptureError) => void) | undefined;
let pumpTimer: ReturnType<typeof setTimeout> | undefined;
let teardownTimer: ReturnType<typeof setTimeout> | undefined;
let waitingForApiSince: number | undefined;

subscribeIconTileVisibility(() => pump());
subscribeIconGeneratorRole(onGeneratorChanged);

function onGeneratorChanged(): void {
  const role = getIconGeneratorRole();
  if (role !== lastRole) {
    lastRole = role;
    if (role === "bystander") {
      standDown();
      return;
    }
    if (role === "generator") {
      adoptDeferredIcons();
    }
  }
  if (isIconGenerationPaused() && !running) {
    setIconGeneratorWanted(false);
  }
  pump();
}

function standDown(): void {
  for (const entry of pending.values()) {
    deferred.set(entry.key, entry.item);
  }
  pending.clear();
  for (const key of deferred.keys()) {
    markIconUnavailable(key);
  }
  setIconGeneratorWanted(false);
}

function adoptDeferredIcons(): void {
  for (const [key, item] of deferred) {
    retractIconUnavailable(key);
    pending.set(key, { attempts: 0, item, key, priority: false });
  }
  deferred.clear();
}

function isDisabled(): boolean {
  if (disabled) {
    return true;
  }
  disabledUntil ??= loadIconBudget().disabledUntil;
  if (Date.now() >= disabledUntil) {
    return false;
  }
  disabled = true;
  return true;
}

export function isIconGenerationDisabled(): boolean {
  return isDisabled();
}

export function disableIconGeneration(forMs = DEPLOYMENT_DISABLE_MS): void {
  disabled = true;
  disableIconBudget(forMs);
  deferred.clear();
  abandonPendingIcons();
  setIconGeneratorWanted(false);
}

function abandonPendingIcons(): void {
  const abandoned = Array.from(pending.keys());
  pending.clear();
  for (const key of abandoned) {
    markIconUnavailable(key);
  }
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
    setIconGeneratorWanted(false);
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
    if (firstVisible === undefined && isIconTileVisible(entry.key)) {
      firstVisible = entry;
    }
    firstQueued ??= entry;
  }
  return newestPrioritized ?? firstVisible ?? firstQueued;
}

function requeue(entry: Pending): void {
  pending.delete(entry.key);
  pending.set(entry.key, entry);
}

function settle(key: string, image: Blob | undefined): void {
  pending.delete(key);
  publishIcon(key, image);
}

async function countWrite(): Promise<void> {
  writes++;
  if (writes % PRUNE_EVERY === 0) {
    await pruneIcons();
  }
}

async function record(key: string, captured: CaptureOutcome): Promise<void> {
  if (captured.image !== undefined) {
    await writeIcon(key, captured.image);
    await countWrite();
    return;
  }
  if (captured.error !== undefined && ITEM_ERRORS.has(captured.error)) {
    await writeIconFailure(key, captured.error);
    await countWrite();
  }
}

async function giveUp(entry: Pending): Promise<void> {
  pending.delete(entry.key);
  markIconUnavailable(entry.key);
  try {
    await writeIconFailure(
      entry.key,
      "timeout",
      Date.now() + TRANSIENT_RETRY_AFTER_MS
    );
    await countWrite();
  } catch {}
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
    const { error } = captured;
    if (error !== undefined && SESSION_ERRORS.has(error)) {
      console.error(
        `[InventorySimulator] 3D inventory icons disabled: the viewer refused to capture (${error}). `
      );
      disableIconGeneration();
      return;
    }
    if (error !== undefined && NETWORK_ERRORS.has(error)) {
      backOffIconNetwork();
      requeue(entry);
      return;
    }
    if (captured.image !== undefined) {
      clearIconNetworkBackoff();
    }
    await record(entry.key, captured);
    settle(entry.key, captured.image);
  } catch {
    entry.attempts++;
    spendIconBudget(1);
    if (entry.attempts < MAX_ATTEMPTS) {
      requeue(entry);
    } else {
      await giveUp(entry);
    }
  } finally {
    failInflight = undefined;
    running = false;
    if (isIconGenerationPaused()) {
      setIconGeneratorWanted(false);
    }
    pump();
  }
}

function awaitGenerator(now: number): void {
  waitingForApiSince ??= now;
  if (now - waitingForApiSince < GENERATOR_STARTUP_TIMEOUT_MS) {
    schedule(GENERATOR_STARTUP_POLL_MS);
    return;
  }
  waitingForApiSince = undefined;
  setIconGeneratorWanted(false);
  schedule(GENERATOR_RETRY_MS);
}

function pump(): void {
  if (pumpTimer !== undefined) {
    clearTimeout(pumpTimer);
    pumpTimer = undefined;
  }
  if (
    isDisabled() ||
    running ||
    isIconGenerationPaused() ||
    getIconGeneratorRole() !== "generator"
  ) {
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
  setIconGeneratorWanted(true);
  const generator = api;
  if (generator === undefined) {
    awaitGenerator(now);
    return;
  }
  waitingForApiSince = undefined;
  void run(generator, next);
}

export function setIconGeneratorApi(next: ViewerApi | undefined): void {
  unsubscribeApi?.();
  unsubscribeApi = undefined;
  api = next;
  if (next !== undefined) {
    waitingForApiSince = undefined;
    const offRateLimited = next.on("rateLimited", ({ retryAfterMs }) => {
      setIconBudgetCooldown(retryAfterMs);
      schedule(retryAfterMs);
    });
    const offUnsupported = next.on("unsupported", ({ reason }) => {
      if (reason === "webgl") {
        disableIconGeneration(WEBGL_DISABLE_MS);
        return;
      }
      if (NETWORK_ERRORS.has(reason)) {
        if (failInflight !== undefined) {
          failInflight(reason);
          return;
        }
        backOffIconNetwork();
        pump();
        return;
      }
      if (ITEM_ERRORS.has(reason)) {
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

function isWorthRetrying(entry: IconEntry): boolean {
  return entry.retryAfter !== undefined && Date.now() >= entry.retryAfter;
}

export async function requestIcon(
  key: string,
  item: ViewerItemInput,
  { priority = false }: { priority?: boolean } = {}
): Promise<void> {
  if (isDisabled() || hasIcon(key) || known.has(key) || pending.has(key)) {
    return;
  }
  known.add(key);
  const entry = await readIcon(key);
  if (entry?.image !== undefined) {
    publishIcon(key, entry.image);
    return;
  }
  if (entry?.error !== undefined && !isWorthRetrying(entry)) {
    markIconUnavailable(key);
    return;
  }
  if (isDisabled()) {
    markIconUnavailable(key);
    return;
  }
  if (getIconGeneratorRole() === "bystander") {
    deferred.set(key, item);
    markIconUnavailable(key);
    return;
  }
  claimIconGeneratorRole();
  pending.set(key, { attempts: 0, item, key, priority });
  pump();
}

export function forgetIcon(key: string): void {
  known.delete(key);
  pending.delete(key);
  deferred.delete(key);
  releaseIcon(key);
}

export async function discardIcon(key: string): Promise<void> {
  if (discarded.has(key)) {
    return;
  }
  discarded.add(key);
  forgetIcon(key);
  await deleteIcon(key);
}
