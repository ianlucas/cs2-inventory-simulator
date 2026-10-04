/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Decimal } from "@prisma/client/runtime/client";
import { beforeEach, expect, test, vi } from "vitest";
import type { CS2ItemExterior } from "~/generated/prisma/enums";
import { findEconomyPrices } from "./economy-price.server";

type Row = Record<
  "avgPrice24h" | "avgPrice7d" | "avgPrice30d" | "avgPrice90d",
  Decimal | null
> & { exterior: CS2ItemExterior | null };

const { findMany } = vi.hoisted(() => ({
  findMany: vi.fn(async (): Promise<Row[]> => [])
}));

vi.mock("~/db.server", () => ({
  prisma: { economyPrice: { findMany } }
}));

function row(exterior: CS2ItemExterior | null, prices: Partial<Row> = {}) {
  return {
    avgPrice24h: null,
    avgPrice7d: null,
    avgPrice30d: null,
    avgPrice90d: null,
    exterior,
    ...prices
  };
}

beforeEach(() => {
  findMany.mockClear();
});

test("findEconomyPrices looks up the item's non-souvenir listings, newest first", async () => {
  await findEconomyPrices({ id: 244, statTrak: true });
  expect(findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      orderBy: { sourceDate: "desc" },
      where: { economyItemId: 244, souvenir: false, statTrak: true }
    })
  );
});

test("findEconomyPrices returns each exterior's first available price as a number", async () => {
  findMany.mockResolvedValueOnce([
    row("FN", { avgPrice7d: new Decimal("12.345678") }),
    row("FT", { avgPrice24h: new Decimal("3"), avgPrice7d: new Decimal("4") })
  ]);
  expect(await findEconomyPrices({ id: 244, statTrak: false })).toEqual([
    { exterior: "FN", price: 12.345678 },
    { exterior: "FT", price: 3 }
  ]);
});

test("findEconomyPrices keeps only each exterior's latest listing", async () => {
  findMany.mockResolvedValueOnce([
    row("FN", { avgPrice24h: new Decimal("2") }),
    row("MW"),
    row("FN", { avgPrice24h: new Decimal("1") }),
    row("MW", { avgPrice24h: new Decimal("1") })
  ]);
  expect(await findEconomyPrices({ id: 244, statTrak: false })).toEqual([
    { exterior: "FN", price: 2 }
  ]);
});

test("findEconomyPrices returns an item without wear's listing without exterior", async () => {
  findMany.mockResolvedValueOnce([
    row(null, { avgPrice90d: new Decimal("0.5") })
  ]);
  expect(await findEconomyPrices({ id: 11422, statTrak: false })).toEqual([
    { exterior: null, price: 0.5 }
  ]);
});
