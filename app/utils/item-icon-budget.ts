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
  at: number;
}

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

function tryPersist(stored: StoredBudget): void {
  try {
    setToLocalStorage(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    return;
  }
}

function write(budget: IconBudget, now: number): IconBudget {
  tryPersist({ ...budget, at: now });
  return budget;
}

export function loadIconBudget(now = Date.now()): IconBudget {
  return read(now);
}

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
