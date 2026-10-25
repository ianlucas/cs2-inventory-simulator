/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { CS2EconomyItem, CS2UnlockedItem } from "@ianlucas/cs2-lib";
import type { Prisma } from "~/generated/prisma/client";
import { logError } from "~/shared/monitoring";
import {
  getUnboxingPayout,
  getUnboxingPrice,
  getUnboxingRarity,
  getUnboxingWeekStart,
  roundSimulatorDollars,
  type UnboxingResult
} from "~/shared/unboxing-league";

type Transaction = Prisma.TransactionClient;

/**
 * Profit from the summed payouts and prices of counted unlocks, in whole cents
 * so equal profits compare equal.
 */
export function getUnboxingProfit({
  payout,
  price
}: {
  payout: Prisma.Decimal | null;
  price: Prisma.Decimal | null;
}) {
  return roundSimulatorDollars(
    (payout?.toNumber() ?? 0) - (price?.toNumber() ?? 0)
  );
}

export async function getUnboxingBalance(
  tx: Transaction,
  { budget, now, userId }: { budget: number; now: Date; userId: string }
) {
  const { _sum } = await tx.userUnlock.aggregate({
    _sum: { payout: true, price: true },
    where: {
      counted: true,
      createdAt: { gte: getUnboxingWeekStart(now), lte: now },
      userId
    }
  });
  return roundSimulatorDollars(budget + getUnboxingProfit(_sum));
}

function priceUnlock(container: CS2EconomyItem, unlockedItem: CS2UnlockedItem) {
  try {
    const statTrak = unlockedItem.attributes.statTrak !== undefined;
    return {
      payout: roundSimulatorDollars(
        getUnboxingPayout(container, {
          id: unlockedItem.id,
          statTrak,
          wear: unlockedItem.attributes.wear
        })
      ),
      price: roundSimulatorDollars(getUnboxingPrice(container)),
      rarity: getUnboxingRarity(container, unlockedItem.id),
      statTrak
    };
  } catch (error) {
    logError("Failed to price unlocked item.", { error });
    return undefined;
  }
}

/**
 * Logs a server-rolled unlock, which counts toward the Unboxing League only
 * while the week's balance covers the container's price.
 */
export async function recordUserUnlock(
  tx: Transaction,
  {
    budget,
    container,
    keyId,
    now,
    unlockedItem,
    userId
  }: {
    budget: number;
    container: CS2EconomyItem;
    keyId: number | undefined;
    now: Date;
    unlockedItem: CS2UnlockedItem;
    userId: string;
  }
): Promise<UnboxingResult | undefined> {
  const priced = priceUnlock(container, unlockedItem);
  if (priced === undefined) {
    return undefined;
  }
  const { payout, price, rarity, statTrak } = priced;
  const balance = await getUnboxingBalance(tx, { budget, now, userId });
  const counted = balance >= price;
  await tx.userUnlock.create({
    data: {
      containerId: container.id,
      counted,
      createdAt: now,
      itemId: unlockedItem.id,
      keyId,
      payout,
      price,
      rarity,
      seed: unlockedItem.attributes.seed,
      statTrak,
      userId,
      wear: unlockedItem.attributes.wear
    }
  });
  return {
    balance: counted
      ? roundSimulatorDollars(balance - price + payout)
      : balance,
    counted,
    payout
  };
}
