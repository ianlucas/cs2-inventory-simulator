/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { getTypedFromLocalStorage, setToLocalStorage } from "./localstorage";

const STORAGE_KEY = "inventoryItemIconBudget";

export const ICON_API_CALLS_PER_MINUTE = 30;
export const ICON_API_CALL_BURST = 30;

const NETWORK_BASE_MS = 30_000;
const NETWORK_CAP_MS = 8 * 60_000;

export interface IconBudget {
  tokens: number;
  cooldownUntil: number;
  disabledUntil: number;
}

interface StoredBudget extends IconBudget {
  networkStep: number;
  at: number;
}

function refill(stored: StoredBudget, now: number): StoredBudget {
  const elapsed = Math.max(0, now - stored.at);
  return {
    ...stored,
    tokens: Math.min(
      ICON_API_CALL_BURST,
      stored.tokens + (elapsed / 60_000) * ICON_API_CALLS_PER_MINUTE
    )
  };
}

function isStored(value: unknown): value is Partial<StoredBudget> {
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

function read(now: number): StoredBudget {
  const value = getTypedFromLocalStorage<unknown>(STORAGE_KEY, undefined);
  if (!isStored(value)) {
    return {
      at: now,
      cooldownUntil: 0,
      disabledUntil: 0,
      networkStep: 0,
      tokens: ICON_API_CALL_BURST
    };
  }
  return refill(
    {
      at: value.at ?? now,
      cooldownUntil: value.cooldownUntil ?? 0,
      disabledUntil: value.disabledUntil ?? 0,
      networkStep: value.networkStep ?? 0,
      tokens: value.tokens ?? ICON_API_CALL_BURST
    },
    now
  );
}

function write(stored: StoredBudget, now: number): IconBudget {
  const next = { ...stored, at: now };
  try {
    setToLocalStorage(STORAGE_KEY, JSON.stringify(next));
  } catch {}
  return next;
}

export function loadIconBudget(now = Date.now()): IconBudget {
  return read(now);
}

export function spendIconBudget(
  apiCalls: number,
  now = Date.now()
): IconBudget {
  const stored = read(now);
  return write(
    { ...stored, tokens: stored.tokens - Math.max(0, apiCalls) },
    now
  );
}

export function setIconBudgetCooldown(
  retryAfterMs: number,
  now = Date.now()
): IconBudget {
  const stored = read(now);
  return write(
    {
      ...stored,
      cooldownUntil: Math.max(
        stored.cooldownUntil,
        now + Math.max(0, retryAfterMs)
      )
    },
    now
  );
}

export function backOffIconNetwork(now = Date.now()): number {
  const stored = read(now);
  const wait = Math.min(
    NETWORK_BASE_MS * 2 ** stored.networkStep,
    NETWORK_CAP_MS
  );
  write(
    {
      ...stored,
      cooldownUntil: Math.max(stored.cooldownUntil, now + wait),
      networkStep: stored.networkStep + 1
    },
    now
  );
  return wait;
}

export function clearIconNetworkBackoff(now = Date.now()): void {
  const stored = read(now);
  if (stored.networkStep === 0) {
    return;
  }
  write({ ...stored, networkStep: 0 }, now);
}

export function disableIconBudget(forMs: number, now = Date.now()): void {
  const stored = read(now);
  write(
    {
      ...stored,
      disabledUntil: Math.max(stored.disabledUntil, now + Math.max(0, forMs))
    },
    now
  );
}
