/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { getTypedFromLocalStorage, setToLocalStorage } from "./localstorage";

const STORAGE_KEY = "inventoryItemIconBudget";

export const ICON_API_CALLS_PER_MINUTE = 30;
export const ICON_API_CALL_BURST = 30;

export interface IconBudget {
  tokens: number;
  cooldownUntil: number;
}

interface StoredBudget extends IconBudget {
  /** Wall-clock time the token count was accurate for. */
  at: number;
}

/**
 * Refills a stored bucket to `now`.
 *
 * A clock that moved backwards yields no refill rather than a negative one, and
 * an arbitrarily old record cannot yield more than the burst, so neither a
 * long-closed tab nor a tampered-with record buys extra budget.
 */
function refill(stored: StoredBudget, now: number): IconBudget {
  const elapsed = Math.max(0, now - stored.at);
  return {
    cooldownUntil: stored.cooldownUntil,
    tokens: Math.min(
      ICON_API_CALL_BURST,
      stored.tokens + (elapsed / 60_000) * ICON_API_CALLS_PER_MINUTE
    )
  };
}

function isStored(value: unknown): value is StoredBudget {
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

function read(now: number): IconBudget {
  const stored = getTypedFromLocalStorage<unknown>(STORAGE_KEY, undefined);
  return isStored(stored)
    ? refill(stored, now)
    : { cooldownUntil: 0, tokens: ICON_API_CALL_BURST };
}

function write(budget: IconBudget, now: number): IconBudget {
  try {
    setToLocalStorage(STORAGE_KEY, JSON.stringify({ ...budget, at: now }));
  } catch {
    // A denied or full quota only costs the bucket its memory across reloads;
    // the server's own per-IP cap is what actually enforces the limit.
  }
  return budget;
}

/** Reads the budget as of `now`, without spending any of it. */
export function loadIconBudget(now = Date.now()): IconBudget {
  return read(now);
}

/**
 * Debits what a capture reported spending.
 *
 * The stored value is re-read rather than tracked in memory so that a second
 * tab's spending is never overwritten by this one's stale idea of the balance:
 * two tabs share one IP, and so one budget.
 */
export function spendIconBudget(
  apiCalls: number,
  now = Date.now()
): IconBudget {
  const budget = read(now);
  return write(
    { ...budget, tokens: budget.tokens - Math.max(0, apiCalls) },
    now
  );
}

/** Records a rate limit the server reported, keeping the longest wait seen. */
export function setIconBudgetCooldown(
  retryAfterMs: number,
  now = Date.now()
): IconBudget {
  const budget = read(now);
  return write(
    {
      ...budget,
      cooldownUntil: Math.max(
        budget.cooldownUntil,
        now + Math.max(0, retryAfterMs)
      )
    },
    now
  );
}
