/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Decimal } from "@prisma/client/runtime/client";
import { beforeEach, expect, test, vi } from "vitest";
import { findEconomyPrice } from "./economy-price.server";

type Prices = Record<
  "avgPrice24h" | "avgPrice7d" | "avgPrice30d" | "avgPrice90d",
  Decimal | null
>;

const { findFirst } = vi.hoisted(() => ({
  findFirst: vi.fn(async (): Promise<Prices | null> => null)
}));

vi.mock("~/db.server", () => ({
  prisma: { economyPrice: { findFirst } }
}));

beforeEach(() => {
  findFirst.mockClear();
});

test("findEconomyPrice looks up the latest non-souvenir listing", async () => {
  await findEconomyPrice({ exterior: "FT", id: 244, statTrak: true });
  expect(findFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      orderBy: { sourceDate: "desc" },
      where: {
        economyItemId: 244,
        exterior: "FT",
        souvenir: false,
        statTrak: true
      }
    })
  );
});

test("findEconomyPrice looks up an item without wear by a null exterior", async () => {
  await findEconomyPrice({ id: 11422, statTrak: false });
  expect(findFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({ exterior: null })
    })
  );
});

test("findEconomyPrice returns the first available price as a number", async () => {
  findFirst.mockResolvedValueOnce({
    avgPrice24h: null,
    avgPrice7d: new Decimal("12.345678"),
    avgPrice30d: new Decimal("20"),
    avgPrice90d: null
  });
  expect(await findEconomyPrice({ id: 244, statTrak: false })).toBe(12.345678);
});

test("findEconomyPrice is null without a listing or any price", async () => {
  expect(await findEconomyPrice({ id: 244, statTrak: false })).toBeNull();
  findFirst.mockResolvedValueOnce({
    avgPrice24h: null,
    avgPrice7d: null,
    avgPrice30d: null,
    avgPrice90d: null
  });
  expect(await findEconomyPrice({ id: 244, statTrak: false })).toBeNull();
});
