/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { prisma } from "~/db.server";
import type { Prisma } from "~/generated/prisma/client";
import { logError } from "~/shared/monitoring";
import { singleton } from "~/singleton.server";
import { economyProjector } from "./economy-projector";

const PRICE_INSERT_BATCH_SIZE = 1_000;
const SNAPSHOT_SOURCE_DATE = new Date("2026-08-02");

async function readSnapshot() {
  // Imported raw so TypeScript never type-checks its 27k rows.
  const { default: json } =
    await import("~/data/economy-prices-2026-08-02.json?raw");
  return JSON.parse(json) as Omit<
    Prisma.EconomyPriceCreateManyInput,
    "sourceDate"
  >[];
}

/**
 * Loads the static price snapshot in `app/data` into `EconomyPrice` once. It's
 * inserted in one transaction, so any row under its source date means it's
 * fully loaded, and a failed load is retried on the next start.
 */
export class EconomyPriceLoader {
  private loading: Promise<void> | undefined;

  start() {
    this.loading ??= this.load().catch((error) => {
      logError("Economy price loader: failed.", { error });
    });
  }

  private async load() {
    // Prices reference economy items, so they must be projected first.
    if (!(await economyProjector.isCurrentAfterRun())) {
      return;
    }
    const loaded = await prisma.economyPrice.findFirst({
      select: { marketHashName: true },
      where: { sourceDate: SNAPSHOT_SOURCE_DATE }
    });
    if (loaded !== null) {
      return;
    }
    const rows = await readSnapshot();
    await prisma.$transaction(
      async (tx) => {
        // A fresh database lacks snapshot items that cs2-lib has since dropped.
        const projectedIds = new Set(
          (await tx.economyItem.findMany({ select: { id: true } })).map(
            ({ id }) => id
          )
        );
        const data = rows
          .filter(({ economyItemId }) => projectedIds.has(economyItemId))
          .map((row) => ({ ...row, sourceDate: SNAPSHOT_SOURCE_DATE }));
        for (
          let index = 0;
          index < data.length;
          index += PRICE_INSERT_BATCH_SIZE
        ) {
          await tx.economyPrice.createMany({
            data: data.slice(index, index + PRICE_INSERT_BATCH_SIZE),
            skipDuplicates: true
          });
        }
      },
      { maxWait: 30_000, timeout: 180_000 }
    );
  }
}

export const economyPriceLoader = singleton(
  "economyPriceLoader",
  () => new EconomyPriceLoader()
);
