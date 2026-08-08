/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, CS2ItemWear } from "@ianlucas/cs2-lib";
import { z } from "zod";
import { prisma } from "~/db.server";
import { singleton } from "~/singleton.server";

const ECONOMY_PRICE_INTERVAL_MS = 60 * 60_000;
const META_ID = 1;
const PRICE_INSERT_BATCH_SIZE = 1_000;
const PRICE_SOURCE_BASE_URL =
  "https://raw.githack.com/LukeX404/cs2-prices-tracker/main/static/prices/date";

const SteamPricesSchema = z.object({
  last_24h: z.number().nullable(),
  last_7d: z.number().nullable(),
  last_30d: z.number().nullable(),
  last_90d: z.number().nullable()
});

const PriceFeedSchema = z.record(
  z.string(),
  z.object({ steam: SteamPricesSchema })
);

type SteamPrices = z.infer<typeof SteamPricesSchema>;

type EconomyPrice = {
  economyItemId: number;
  exterior: CS2ItemWear | null;
  last24h: number | null;
  last7d: number | null;
  last30d: number | null;
  last90d: number | null;
  marketHashName: string;
  souvenir: boolean;
  statTrak: boolean;
};

const EXTERIOR_BY_NAME = new Map<string, CS2ItemWear>([
  ["Battle-Scarred", CS2ItemWear.BattleScarred],
  ["Factory New", CS2ItemWear.FactoryNew],
  ["Field-Tested", CS2ItemWear.FieldTested],
  ["Minimal Wear", CS2ItemWear.MinimalWear],
  ["Well-Worn", CS2ItemWear.WellWorn]
]);

let economyItemIdsByName: Map<string, number> | undefined;

function priceSourceDateString(sourceDate: Date) {
  return sourceDate.toISOString().slice(0, 10);
}

export function getEconomyPriceSourceDate(now = new Date()) {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1)
  );
}

export function getEconomyPriceSourceUrl(sourceDate: Date) {
  return `${PRICE_SOURCE_BASE_URL}/${priceSourceDateString(sourceDate)}.json`;
}

function parseMarketHashName(marketHashName: string) {
  let name = marketHashName;
  let exterior: CS2ItemWear | null = null;
  let souvenir = false;
  let statTrak = false;
  const exteriorMatch = name.match(/ \(([^)]+)\)$/);
  const parsedExterior =
    exteriorMatch === null ? undefined : EXTERIOR_BY_NAME.get(exteriorMatch[1]);
  if (parsedExterior !== undefined && exteriorMatch !== null) {
    exterior = parsedExterior;
    name = name.slice(0, -exteriorMatch[0].length);
  }
  let changed = true;
  while (changed) {
    changed = false;
    if (name.startsWith("★ ")) {
      name = name.slice("★ ".length);
      changed = true;
    }
    if (name.startsWith("StatTrak™ ")) {
      name = name.slice("StatTrak™ ".length);
      statTrak = true;
      changed = true;
    }
    if (name.startsWith("Souvenir ")) {
      name = name.slice("Souvenir ".length);
      souvenir = true;
      changed = true;
    }
  }
  if (name.startsWith("Sealed Graffiti | ")) {
    name = `Graffiti | ${name.slice("Sealed Graffiti | ".length)}`;
  }
  return { exterior, name, souvenir, statTrak };
}

function getEconomyItemId(name: string) {
  economyItemIdsByName ??= new Map(
    CS2Economy.itemsAsArray.map((item) => [item.name, item.id])
  );
  return (
    economyItemIdsByName.get(name) ??
    economyItemIdsByName.get(`Agent | ${name}`)
  );
}

export function mapEconomyPrice(
  marketHashName: string,
  prices: SteamPrices
): EconomyPrice | undefined {
  const { exterior, name, souvenir, statTrak } =
    parseMarketHashName(marketHashName);
  const economyItemId = getEconomyItemId(name);
  if (economyItemId === undefined) {
    return undefined;
  }
  return {
    economyItemId,
    exterior,
    last24h: prices.last_24h,
    last7d: prices.last_7d,
    last30d: prices.last_30d,
    last90d: prices.last_90d,
    marketHashName,
    souvenir,
    statTrak
  };
}

export function mapEconomyPrices(feed: unknown) {
  const parsedFeed = PriceFeedSchema.parse(feed);
  const prices: EconomyPrice[] = [];
  const unmatchedNames: string[] = [];
  for (const [marketHashName, value] of Object.entries(parsedFeed)) {
    const price = mapEconomyPrice(marketHashName, value.steam);
    if (price === undefined) {
      unmatchedNames.push(marketHashName);
    } else {
      prices.push(price);
    }
  }
  return { prices, unmatchedNames };
}

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
    const { prices, unmatchedNames } = await fetchEconomyPrices(sourceDate);
    await prisma.$transaction(async (tx) => {
      for (
        let index = 0;
        index < prices.length;
        index += PRICE_INSERT_BATCH_SIZE
      ) {
        await tx.economyPrice.createMany({
          data: prices
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
          lastUnmatchedCount: unmatchedNames.length,
          lastUnmatchedNames: unmatchedNames.slice(0, 20).join("\n") || null
        },
        where: { id: META_ID }
      });
    });
    console.log(
      `Economy prices: mirrored ${prices.length} items for ${priceSourceDateString(sourceDate)} (${unmatchedNames.length} unmatched) in ${Math.round(performance.now() - startedAt)}ms.`
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
      `Economy prices: failed to mirror ${priceSourceDateString(sourceDate)}.`
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
