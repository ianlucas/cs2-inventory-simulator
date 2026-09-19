/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { beforeEach, describe, expect, it } from "vitest";
import {
  ICON_API_CALLS_PER_MINUTE,
  ICON_API_CALL_BURST,
  loadIconBudget,
  setIconBudgetCooldown,
  spendIconBudget
} from "./item-icon-budget";

const STORAGE_KEY = "inventoryItemIconBudget";
const START = 1_700_000_000_000;

beforeEach(() => {
  window.localStorage.clear();
});

describe("icon budget", () => {
  it("starts a browser that has never generated with the full burst", () => {
    expect(loadIconBudget(START).tokens).toBe(ICON_API_CALL_BURST);
  });

  it("carries spending across a reload, which is the whole point of storing it", () => {
    spendIconBudget(ICON_API_CALL_BURST, START);
    expect(loadIconBudget(START).tokens).toBe(0);
  });

  it("refills by wall-clock, so a closed tab still earns budget", () => {
    spendIconBudget(ICON_API_CALL_BURST, START);
    expect(loadIconBudget(START + 60_000).tokens).toBe(
      ICON_API_CALLS_PER_MINUTE
    );
  });

  it("caps an old record at the burst, so a long absence buys no more than a short one", () => {
    spendIconBudget(ICON_API_CALL_BURST, START);
    expect(loadIconBudget(START + 86_400_000).tokens).toBe(ICON_API_CALL_BURST);
  });

  it("grants nothing for a clock that moved backwards", () => {
    spendIconBudget(ICON_API_CALL_BURST, START);
    expect(loadIconBudget(START - 600_000).tokens).toBe(0);
  });

  it("does not overwrite another tab's spending with its own stale balance", () => {
    expect(loadIconBudget(START).tokens).toBe(ICON_API_CALL_BURST);
    spendIconBudget(ICON_API_CALL_BURST / 2, START);
    spendIconBudget(ICON_API_CALL_BURST / 2, START);
    expect(loadIconBudget(START).tokens).toBe(0);
  });

  it("keeps a rate-limit cooldown across a reload, and the longest one seen", () => {
    setIconBudgetCooldown(60_000, START);
    setIconBudgetCooldown(10_000, START);
    expect(loadIconBudget(START).cooldownUntil).toBe(START + 60_000);
  });

  it("spends without clearing a cooldown, and waits without refunding tokens", () => {
    setIconBudgetCooldown(60_000, START);
    spendIconBudget(5, START);
    const budget = loadIconBudget(START);
    expect(budget.cooldownUntil).toBe(START + 60_000);
    expect(budget.tokens).toBe(ICON_API_CALL_BURST - 5);
  });

  it("falls back to a full burst rather than trusting an unreadable record", () => {
    window.localStorage.setItem(STORAGE_KEY, "not json");
    expect(loadIconBudget(START).tokens).toBe(ICON_API_CALL_BURST);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ tokens: "x" }));
    expect(loadIconBudget(START).tokens).toBe(ICON_API_CALL_BURST);
  });
});
