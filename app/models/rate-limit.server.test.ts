/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { expect, test, vi } from "vitest";

vi.mock("~/db.server", () => ({ prisma: {} }));

import {
  SPRAY_CONSUME_RATE_LIMIT,
  STATTRAK_INCREMENT_RATE_LIMIT,
  refillAndConsume
} from "./rate-limit.server";

test("full bucket consumes a token", () => {
  const { consumed, tokens } = refillAndConsume(
    50,
    0,
    STATTRAK_INCREMENT_RATE_LIMIT
  );
  expect(consumed).toBe(true);
  expect(tokens).toBe(49);
});

test("empty bucket denies without losing fractional refill", () => {
  const { consumed, tokens } = refillAndConsume(
    0,
    1.8,
    STATTRAK_INCREMENT_RATE_LIMIT
  );
  expect(consumed).toBe(false);
  expect(tokens).toBeCloseTo(0.5);
});

test("empty bucket allows again after one refill interval", () => {
  const { consumed, tokens } = refillAndConsume(
    0,
    3.6,
    STATTRAK_INCREMENT_RATE_LIMIT
  );
  expect(consumed).toBe(true);
  expect(tokens).toBeCloseTo(0);
});

test("refill clamps at capacity", () => {
  const { consumed, tokens } = refillAndConsume(
    0,
    86_400,
    STATTRAK_INCREMENT_RATE_LIMIT
  );
  expect(consumed).toBe(true);
  expect(tokens).toBe(49);
});

test("sustained rate is 1,000 per hour after the burst", () => {
  let tokens = 50;
  let accepted = 0;
  // One request per second for an hour.
  for (let second = 0; second < 3_600; second++) {
    const result = refillAndConsume(tokens, 1, STATTRAK_INCREMENT_RATE_LIMIT);
    tokens = result.tokens;
    if (result.consumed) {
      accepted++;
    }
  }
  expect(accepted).toBeLessThanOrEqual(1_050);
  expect(accepted).toBeGreaterThanOrEqual(1_000);
});

test("spray acts as a strict 30s cooldown", () => {
  const first = refillAndConsume(1, 0, SPRAY_CONSUME_RATE_LIMIT);
  expect(first.consumed).toBe(true);
  expect(first.tokens).toBe(0);
  expect(
    refillAndConsume(first.tokens, 29, SPRAY_CONSUME_RATE_LIMIT).consumed
  ).toBe(false);
  expect(
    refillAndConsume(first.tokens, 30, SPRAY_CONSUME_RATE_LIMIT).consumed
  ).toBe(true);
});

test("spray never accumulates a burst", () => {
  const { tokens } = refillAndConsume(0, 86_400, SPRAY_CONSUME_RATE_LIMIT);
  expect(tokens).toBe(0);
});
