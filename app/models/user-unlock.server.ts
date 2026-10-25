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

type Client = Pick<Prisma.TransactionClient, "userUnlock">;

export async function getUnboxingBalance(
  client: Client,
  { budget, now, userId }: { budget: number; now: Date; userId: string }
) {
  const { _sum } = await client.userUnlock.aggregate({
    _sum: { payout: true, price: true },
    where: {
      counted: true,
      createdAt: { gte: getUnboxingWeekStart(now), lte: now },
      userId
    }
  });
  return roundSimulatorDollars(
    budget + (_sum.payout?.toNumber() ?? 0) - (_sum.price?.toNumber() ?? 0)
  );
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
  client: Client,
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
  const balance = await getUnboxingBalance(client, { budget, now, userId });
  const counted = balance >= price;
  await client.userUnlock.create({
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
