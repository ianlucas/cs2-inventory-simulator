/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { prisma } from "~/db.server";
import { getErrorMessage } from "~/shared/misc";
import { logError } from "~/shared/monitoring";
import { Job } from "~/shared/scheduling";
import { singleton } from "~/singleton.server";
import {
  getEconomyPriceSourceDate,
  getEconomyPriceSourceUrl,
  mapEconomyPrices,
  priceSourceDateString
} from "./economy-price-data";
import { economyProjector } from "./economy-projector";

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
  // Prisma runs an upsert with an empty update as read-then-insert, which races
  // between processes overlapping on a deploy; skipDuplicates uses ON CONFLICT.
  await prisma.economyPriceSyncState.createMany({
    data: { id: META_ID },
    skipDuplicates: true
  });
  return await prisma.economyPriceSyncState.findUniqueOrThrow({
    where: { id: META_ID }
  });
}

async function syncEconomyPrices() {
  // A projection run clears lastSucceededSourceDate to mirror today's prices
  // for new items, so wait for it before deciding whether they're in.
  if (!(await economyProjector.isCurrentAfterRun())) {
    return;
  }
  const sourceDate = getEconomyPriceSourceDate();
  const meta = await createMeta();
  if (meta.lastSucceededSourceDate?.getTime() === sourceDate.getTime()) {
    return;
  }
  await prisma.economyPriceSyncState.update({
    data: { lastAttemptedAt: new Date(), lastAttemptedSourceDate: sourceDate },
    where: { id: META_ID }
  });
  try {
    const { prices, unmatchedNames } = await fetchEconomyPrices(sourceDate);
    await prisma.$transaction(
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
        await tx.economyPriceSyncState.update({
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
      },
      { maxWait: 30_000, timeout: 180_000 }
    );
  } catch (error) {
    const message = getErrorMessage(error);
    await prisma.economyPriceSyncState.update({
      data: {
        lastFailureAt: new Date(),
        lastFailureMessage: message.slice(0, 1_000)
      },
      where: { id: META_ID }
    });
    logError("Economy price sync: failed to mirror.", {
      error,
      extra: { sourceDate: priceSourceDateString(sourceDate) }
    });
  }
}

export const economyPriceSync = singleton(
  "economyPriceSync",
  () =>
    new Job("Economy price sync", ECONOMY_PRICE_INTERVAL_MS, syncEconomyPrices)
);
