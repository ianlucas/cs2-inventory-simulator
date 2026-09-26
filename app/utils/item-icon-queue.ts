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
  recycleIconGenerator,
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
export const ICON_GENERATOR_STARTUP_TIMEOUT_MS = 60_000;
export const ICON_GENERATOR_RETRY_MS = 60_000;

const PRUNE_EVERY = 32;
const MAX_ATTEMPTS = 3;
const MAX_NETWORK_FAILURES = 5;

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
const ITEM_RETRY_AFTER_MS = 5 * 60_000;
const WEBGL_DISABLE_MS = 6 * 60 * 60_000;
const DEPLOYMENT_DISABLE_MS = 24 * 60 * 60_000;
const GENERATOR_STARTUP_POLL_MS = 1_000;

interface Pending {
  key: string;
  item: ViewerItemInput;
  priority: boolean;
  attempts: number;
  networkFailures: number;
}

type CaptureOutcome = Omit<ViewerCaptured, "item">;

const pending = new Map<string, Pending>();
const known = new Set<string>();
const deferred = new Map<string, ViewerItemInput>();
const discarded = new Set<string>();

let api: ViewerApi | undefined;
let unsubscribeApi: (() => void) | undefined;
let disabledUntil: number | undefined;
let running = false;
let writes = 0;
let lastRole: IconGeneratorRole = "unclaimed";
let failInflight: ((error: ViewerCaptureError) => void) | undefined;
let pumpTimer: ReturnType<typeof setTimeout> | undefined;
let teardownTimer: ReturnType<typeof setTimeout> | undefined;
let waitingForApiSince: number | undefined;
let generatorRetryAt = 0;
let seed: Pending | undefined;

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
    pending.set(key, {
      attempts: 0,
      item,
      key,
      networkFailures: 0,
      priority: false
    });
  }
  deferred.clear();
}

function isDisabled(): boolean {
  disabledUntil ??= loadIconBudget().disabledUntil;
  return Date.now() < disabledUntil;
}

export function isIconGenerationDisabled(): boolean {
  return isDisabled();
}

export function disableIconGeneration(forMs = DEPLOYMENT_DISABLE_MS): void {
  disableIconBudget(forMs);
  disabledUntil = Math.max(
    disabledUntil ?? loadIconBudget().disabledUntil,
    Date.now() + forMs
  );
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

function detachApi(): void {
  unsubscribeApi?.();
  unsubscribeApi = undefined;
  api = undefined;
}

// A viewer that failed or stalled may be wedged (a fatal viewer stops
// answering altogether), so the next capture gets a fresh one. A generator
// already replaced or unmounted is left alone.
function recycleGenerator(failed: ViewerApi | undefined = api): void {
  if (failed === undefined || failed !== api) {
    return;
  }
  detachApi();
  waitingForApiSince = undefined;
  recycleIconGenerator();
}

function retryGeneratorLater(failed: ViewerApi | undefined = api): void {
  generatorRetryAt = Date.now() + ICON_GENERATOR_RETRY_MS;
  recycleGenerator(failed);
  setIconGeneratorWanted(false);
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

// Boots the viewer on the item it will most likely capture first, rather than
// on its own default item.
export function getIconGeneratorSeed(): ViewerItemInput | undefined {
  return seed?.item;
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

async function giveUp(
  entry: Pending,
  error: ViewerCaptureError = "timeout"
): Promise<void> {
  pending.delete(entry.key);
  markIconUnavailable(entry.key);
  try {
    await writeIconFailure(
      entry.key,
      error,
      Date.now() + TRANSIENT_RETRY_AFTER_MS
    );
    await countWrite();
  } catch {}
}

async function retryOrGiveUp(
  generator: ViewerApi,
  entry: Pending
): Promise<void> {
  entry.attempts++;
  recycleGenerator(generator);
  if (entry.attempts < MAX_ATTEMPTS) {
    requeue(entry);
  } else {
    await giveUp(entry);
  }
}

async function retryAfterNetworkFailure(
  generator: ViewerApi,
  entry: Pending,
  error: ViewerCaptureError
): Promise<void> {
  backOffIconNetwork();
  recycleGenerator(generator);
  entry.networkFailures++;
  if (entry.networkFailures < MAX_NETWORK_FAILURES) {
    requeue(entry);
  } else {
    await giveUp(entry, error);
  }
}

async function rejectItem(
  entry: Pending,
  error: ViewerCaptureError
): Promise<void> {
  console.warn(
    `[InventorySimulator] The 3D viewer could not render an item's icon (${error}): ${entry.key}`
  );
  await writeIconFailure(entry.key, error, Date.now() + ITEM_RETRY_AFTER_MS);
  await countWrite();
  settle(entry.key, undefined);
}

function awaitReady(generator: ViewerApi): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    generator.whenReady().then(() => true),
    new Promise<boolean>((resolve) => {
      timer = setTimeout(
        () => resolve(false),
        ICON_GENERATOR_STARTUP_TIMEOUT_MS
      );
    })
  ]).finally(() => clearTimeout(timer));
}

async function run(generator: ViewerApi, entry: Pending): Promise<void> {
  running = true;
  try {
    if (!(await awaitReady(generator))) {
      retryGeneratorLater(generator);
      return;
    }
    const captured: CaptureOutcome = await Promise.race([
      generator.capture(entry.item, { timeoutMs: ICON_CAPTURE_TIMEOUT_MS }),
      new Promise<CaptureOutcome>((resolve) => {
        failInflight = (error) => resolve({ apiCalls: 1, error });
      })
    ]);
    spendIconBudget(captured.apiCalls);
    const { error, image } = captured;
    if (image !== undefined) {
      clearIconNetworkBackoff();
      await writeIcon(entry.key, image);
      await countWrite();
      settle(entry.key, image);
      return;
    }
    if (error === "webgl") {
      disableIconGeneration(WEBGL_DISABLE_MS);
      return;
    }
    if (error !== undefined && SESSION_ERRORS.has(error)) {
      console.error(
        `[InventorySimulator] 3D inventory icons disabled: the viewer refused to capture (${error}). `
      );
      disableIconGeneration();
      return;
    }
    if (error !== undefined && NETWORK_ERRORS.has(error)) {
      await retryAfterNetworkFailure(generator, entry, error);
      return;
    }
    if (error !== undefined && ITEM_ERRORS.has(error)) {
      await rejectItem(entry, error);
      return;
    }
    await retryOrGiveUp(generator, entry);
  } catch {
    spendIconBudget(1);
    await retryOrGiveUp(generator, entry);
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
  if (now - waitingForApiSince < ICON_GENERATOR_STARTUP_TIMEOUT_MS) {
    schedule(GENERATOR_STARTUP_POLL_MS);
    return;
  }
  waitingForApiSince = undefined;
  retryGeneratorLater();
  schedule(ICON_GENERATOR_RETRY_MS);
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
  if (now < generatorRetryAt) {
    schedule(generatorRetryAt - now);
    return;
  }
  cancelTeardown();
  const generator = api;
  if (generator === undefined) {
    seed = next;
    setIconGeneratorWanted(true);
    awaitGenerator(now);
    return;
  }
  setIconGeneratorWanted(true);
  seed = undefined;
  waitingForApiSince = undefined;
  void run(generator, next);
}

export function setIconGeneratorApi(next: ViewerApi | undefined): void {
  detachApi();
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
        recycleGenerator();
        pump();
      }
      // An item reason out of band is about the item the viewer booted with;
      // a capture's own item errors arrive on its reply.
    });
    unsubscribeApi = () => {
      offRateLimited();
      offUnsupported();
    };
  }
  pump();
}

function isWorthRetrying(entry: IconEntry): boolean {
  return entry.retryAfter === undefined || Date.now() >= entry.retryAfter;
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
  pending.set(key, { attempts: 0, item, key, networkFailures: 0, priority });
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
