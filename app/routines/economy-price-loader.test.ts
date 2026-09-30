/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { beforeEach, describe, expect, it, vi } from "vitest";

type Price = { economyItemId: number; marketHashName: string };

const mocks = vi.hoisted(() => {
  const tx = {
    economyItem: { findMany: vi.fn(async () => [{ id: 1 }]) },
    economyPrice: {
      createMany: vi.fn<
        (args: { data: Price[]; skipDuplicates: boolean }) => Promise<unknown>
      >(async () => ({ count: 0 }))
    }
  };
  return {
    isCurrentAfterRun: vi.fn(async () => true),
    readSnapshot: vi.fn(() => "[]"),
    tx,
    prisma: {
      economyPrice: {
        findFirst: vi.fn(
          async (): Promise<{ marketHashName: string } | null> => null
        )
      },
      $transaction: vi.fn(
        async (run: (client: typeof tx) => unknown) => await run(tx)
      )
    }
  };
});

vi.mock("~/data/economy-prices-2026-08-02.json?raw", () => ({
  get default() {
    return mocks.readSnapshot();
  }
}));
vi.mock("~/db.server", () => ({ prisma: mocks.prisma }));
vi.mock("~/shared/monitoring", () => ({ logError: vi.fn() }));
vi.mock("./economy-projector", () => ({
  economyProjector: { isCurrentAfterRun: mocks.isCurrentAfterRun }
}));

import { logError } from "~/shared/monitoring";
import { EconomyPriceLoader } from "./economy-price-loader";

const SOURCE_DATE = new Date("2026-08-02");

function price(economyItemId: number, marketHashName: string) {
  return {
    economyItemId,
    exterior: null,
    avgPrice24h: 1.5,
    avgPrice7d: null,
    avgPrice30d: 2,
    avgPrice90d: 2.25,
    marketHashName,
    souvenir: false,
    statTrak: false
  };
}

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("EconomyPriceLoader", () => {
  it("waits for the economy projection and skips when it isn't current", async () => {
    mocks.isCurrentAfterRun.mockResolvedValueOnce(false);
    new EconomyPriceLoader().start();
    await vi.waitFor(() => expect(mocks.isCurrentAfterRun).toHaveBeenCalled());
    await flush();
    expect(mocks.prisma.economyPrice.findFirst).not.toHaveBeenCalled();
    expect(mocks.readSnapshot).not.toHaveBeenCalled();
  });

  it("skips without reading the snapshot once it's loaded", async () => {
    mocks.prisma.economyPrice.findFirst.mockResolvedValueOnce({
      marketHashName: "AK-47 | Redline (Field-Tested)"
    });
    new EconomyPriceLoader().start();
    await vi.waitFor(() =>
      expect(mocks.prisma.economyPrice.findFirst).toHaveBeenCalledWith({
        select: { marketHashName: true },
        where: { sourceDate: SOURCE_DATE }
      })
    );
    await flush();
    expect(mocks.readSnapshot).not.toHaveBeenCalled();
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });

  it("inserts the snapshot in batches under its source date, skipping items that aren't projected", async () => {
    const prices = Array.from({ length: 1_001 }, (_, index) =>
      price(1, `Item ${index}`)
    );
    mocks.readSnapshot.mockReturnValueOnce(
      JSON.stringify([...prices, price(2, "Dropped item")])
    );
    const loader = new EconomyPriceLoader();
    loader.start();
    loader.start();
    await vi.waitFor(() =>
      expect(mocks.tx.economyPrice.createMany).toHaveBeenCalledTimes(2)
    );
    await flush();
    expect(mocks.prisma.$transaction).toHaveBeenCalledTimes(1);
    const batches = mocks.tx.economyPrice.createMany.mock.calls.map(
      ([args]) => args
    );
    expect(batches.map(({ data }) => data.length)).toEqual([1_000, 1]);
    expect(batches.every(({ skipDuplicates }) => skipDuplicates)).toBe(true);
    expect(batches.flatMap(({ data }) => data)).toEqual(
      prices.map((price) => ({ ...price, sourceDate: SOURCE_DATE }))
    );
  });

  it("logs a failed load", async () => {
    mocks.prisma.$transaction.mockRejectedValueOnce(
      new Error("Transaction failed.")
    );
    new EconomyPriceLoader().start();
    await vi.waitFor(() =>
      expect(logError).toHaveBeenCalledWith("Economy price loader: failed.", {
        error: expect.any(Error)
      })
    );
  });
});
