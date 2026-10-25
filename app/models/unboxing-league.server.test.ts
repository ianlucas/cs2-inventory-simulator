/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Decimal } from "@prisma/client/runtime/client";
import { beforeEach, expect, test, vi } from "vitest";

const NOW = new Date("2026-10-21T12:00:00.000Z");
const USER_ID = "76561198000000001";

const mocks = vi.hoisted(() => {
  const state = {
    lastUnlockPrice: null as number | null,
    spent: { payout: 0, price: 0 }
  };
  return {
    prisma: {
      unboxingLeagueEntry: { findMany: vi.fn(async () => []) },
      userUnlock: {
        aggregate: vi.fn(async () => ({
          _count: 0,
          _sum: {
            payout: new Decimal(state.spent.payout),
            price: new Decimal(state.spent.price)
          }
        })),
        count: vi.fn(async () => 0),
        findFirst: vi.fn(async ({ select }: { select: object }) =>
          "price" in select && state.lastUnlockPrice !== null
            ? { price: new Decimal(state.lastUnlockPrice) }
            : null
        )
      }
    },
    state
  };
});

vi.mock("~/db.server", () => ({ prisma: mocks.prisma }));

import { getUnboxingStats } from "./unboxing-league.server";

async function getIsOutOfBudget() {
  return (await getUnboxingStats(USER_ID, { budget: 1000, now: NOW }))
    .isOutOfBudget;
}

beforeEach(() => {
  Object.assign(mocks.state, {
    lastUnlockPrice: null,
    spent: { payout: 100, price: 1095 }
  });
});

test("getUnboxingStats is out of budget once the last container costs more than the balance", async () => {
  mocks.state.lastUnlockPrice = 14.64;
  expect(await getIsOutOfBudget()).toBe(true);
});

test("getUnboxingStats isn't out of budget while the last container is still affordable", async () => {
  mocks.state.lastUnlockPrice = 2.64;
  expect(await getIsOutOfBudget()).toBe(false);
});

test("getUnboxingStats isn't out of budget before the first unlock", async () => {
  expect(await getIsOutOfBudget()).toBe(false);
});
