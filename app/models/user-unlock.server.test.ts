/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2_ITEMS, CS2Economy, ensure } from "@ianlucas/cs2-lib";
import { english } from "@ianlucas/cs2-lib/translations/english";
import { Decimal } from "@prisma/client/runtime/client";
import { expect, test, vi } from "vitest";
import {
  getUnboxingPayout,
  getUnboxingPrice,
  roundSimulatorDollars
} from "~/shared/unboxing-league";
import { recordUserUnlock } from "./user-unlock.server";

const KILOWATT_CASE_ID = 11422;
const KILOWATT_CASE_KEY_ID = 11423;
const NOW = new Date("2026-10-21T12:00:00.000Z");
const USER_ID = "76561198000000001";

CS2Economy.load({ items: CS2_ITEMS, language: english });

function createClient(sums: { payout: number; price: number } | null) {
  return {
    userUnlock: {
      aggregate: vi.fn(async () => ({
        _sum: {
          payout: sums === null ? null : new Decimal(sums.payout),
          price: sums === null ? null : new Decimal(sums.price)
        }
      })),
      create: vi.fn(async () => ({}))
    }
  };
}

const container = CS2Economy.getById(KILOWATT_CASE_ID);
const unlockable = ensure(container.listUnlockableItems()[0]);
const unlockedItem = {
  attributes: {
    containerId: KILOWATT_CASE_ID,
    seed: 42,
    statTrak: undefined,
    wear: unlockable.wearMin
  },
  id: unlockable.id,
  rarity: "rare" as const,
  special: false
};
const price = roundSimulatorDollars(getUnboxingPrice(container));
const payout = roundSimulatorDollars(
  getUnboxingPayout(container, {
    id: unlockable.id,
    statTrak: false,
    wear: unlockable.wearMin
  })
);

async function record(client: ReturnType<typeof createClient>) {
  return await recordUserUnlock(client as never, {
    budget: 1000,
    container,
    keyId: KILOWATT_CASE_KEY_ID,
    now: NOW,
    unlockedItem,
    userId: USER_ID
  });
}

test("recordUserUnlock counts an unlock the week's balance can afford", async () => {
  const client = createClient(null);
  expect(await record(client)).toEqual({
    balance: roundSimulatorDollars(1000 - price + payout),
    counted: true,
    payout
  });
  expect(client.userUnlock.aggregate).toHaveBeenCalledWith({
    _sum: { payout: true, price: true },
    where: {
      counted: true,
      createdAt: { gte: new Date("2026-10-19T00:00:00.000Z"), lte: NOW },
      userId: USER_ID
    }
  });
  expect(client.userUnlock.create).toHaveBeenCalledWith({
    data: {
      containerId: KILOWATT_CASE_ID,
      counted: true,
      createdAt: NOW,
      itemId: unlockable.id,
      keyId: KILOWATT_CASE_KEY_ID,
      payout,
      price,
      rarity: unlockable.rarity,
      seed: 42,
      statTrak: false,
      userId: USER_ID,
      wear: unlockable.wearMin
    }
  });
});

test("recordUserUnlock logs an unaffordable unlock without counting it", async () => {
  const client = createClient({ payout: 100, price: 1095 });
  expect(await record(client)).toEqual({
    balance: 5,
    counted: false,
    payout
  });
  expect(client.userUnlock.create).toHaveBeenCalledWith({
    data: expect.objectContaining({ counted: false, payout, price })
  });
});
