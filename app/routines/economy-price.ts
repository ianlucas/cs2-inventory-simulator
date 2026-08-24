/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { prisma } from "~/db.server";
import { singleton } from "~/singleton.server";
import {
  getEconomyPriceSourceDate,
  getEconomyPriceSourceUrl,
  mapEconomyPrices,
  priceSourceDateString
} from "./economy-price-data";
import { waitForEconomyProjection } from "./inventory-projection";

const ECONOMY_PRICE_INTERVAL_MS = 60 * 60_000;
const META_ID = 1;
const PRICE_INSERT_BATCH_SIZE = 1_000;
async function fetchEconomyPrices(sourceDate: Date) {
  const response = await fetch(getEconomyPriceSourceUrl(sourceDate), {
    signal: AbortSignal.timeout(30_000)
  });
  if (!response.ok) {
    throw new Error(`Price source returned HTTP ${response.status}.`);
  }
  return mapEconomyPrices(await response.json());
}

async function createMeta() {
  return await prisma.economyPriceMeta.upsert({
    create: { id: META_ID },
    update: {},
    where: { id: META_ID }
  });
}

export async function syncEconomyPrices() {
  const startedAt = performance.now();
  const sourceDate = getEconomyPriceSourceDate();
  const meta = await createMeta();
  if (meta.lastSucceededSourceDate?.getTime() === sourceDate.getTime()) {
    return;
  }
  await prisma.economyPriceMeta.update({
    data: { lastAttemptedAt: new Date(), lastAttemptedSourceDate: sourceDate },
    where: { id: META_ID }
  });
  try {
    await waitForEconomyProjection();
    const { prices, unmatchedNames } = await fetchEconomyPrices(sourceDate);
    const result = await prisma.$transaction(
      async (tx) => {
        const projectedIds = new Set(
          (await tx.economyItem.findMany({ select: { id: true } })).map(
            ({ id }) => id
          )
        );
        if (projectedIds.size === 0) {
          throw new Error("Economy items are not projected yet.");
        }
        const unmatched = [...unmatchedNames];
        const mirrored = prices.filter((price) => {
          if (projectedIds.has(price.economyItemId)) {
            return true;
          }
          unmatched.push(price.marketHashName);
          return false;
        });
        for (
          let index = 0;
          index < mirrored.length;
          index += PRICE_INSERT_BATCH_SIZE
        ) {
          await tx.economyPrice.createMany({
            data: mirrored
              .slice(index, index + PRICE_INSERT_BATCH_SIZE)
              .map((price) => ({ ...price, sourceDate })),
            skipDuplicates: true
          });
        }
        await tx.economyPriceMeta.update({
          data: {
            lastFailureAt: null,
            lastFailureMessage: null,
            lastSucceededAt: new Date(),
            lastSucceededSourceDate: sourceDate,
            lastUnmatchedCount: unmatched.length,
            lastUnmatchedNames: unmatched.slice(0, 20).join("\n") || null
          },
          where: { id: META_ID }
        });
        return { mirrored: mirrored.length, unmatched: unmatched.length };
      },
      { maxWait: 30_000, timeout: 180_000 }
    );
    console.log(
      `Economy prices: mirrored ${result.mirrored} items for ${priceSourceDateString(sourceDate)} (${result.unmatched} unmatched) in ${Math.round(performance.now() - startedAt)}ms.`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    await prisma.economyPriceMeta.update({
      data: {
        lastFailureAt: new Date(),
        lastFailureMessage: message.slice(0, 1_000)
      },
      where: { id: META_ID }
    });
    console.log(
      `Economy prices: failed to mirror ${priceSourceDateString(sourceDate)}. ${message}`
    );
  }
}

function schedule(intervalMs: number, run: () => Promise<void>) {
  let running = false;
  const invoke = async () => {
    if (running) {
      return;
    }
    running = true;
    try {
      await run();
    } catch {
      console.log("Economy prices: job failed.");
    } finally {
      running = false;
    }
  };
  void invoke();
  return setInterval(() => void invoke(), intervalMs);
}

export function scheduleEconomyPrices() {
  singleton("economyPrices", () => {
    return schedule(ECONOMY_PRICE_INTERVAL_MS, syncEconomyPrices);
  });
}
