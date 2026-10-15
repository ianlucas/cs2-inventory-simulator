/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Decimal } from "@prisma/client/runtime/client";
import { beforeEach, expect, test, vi } from "vitest";
import type { CS2ItemExterior } from "~/generated/prisma/enums";
import { findEconomyPrices } from "./economy-price.server";

type Row = {
  approximate: boolean;
  exterior: CS2ItemExterior | null;
  price: Decimal;
  statTrak: boolean;
};

const { findMany } = vi.hoisted(() => ({
  findMany: vi.fn(async (): Promise<Row[]> => [])
}));

vi.mock("~/db.server", () => ({
  prisma: { economyPrice: { findMany } }
}));

function row(
  exterior: CS2ItemExterior | null,
  price: string,
  { approximate = false, statTrak = false } = {}
) {
  return { approximate, exterior, price: new Decimal(price), statTrak };
}

beforeEach(() => {
  findMany.mockClear();
});

test("findEconomyPrices looks up the item's listings", async () => {
  await findEconomyPrices({ id: 244, statTrak: true });
  expect(findMany).toHaveBeenCalledWith(
    expect.objectContaining({ where: { economyItemId: 244 } })
  );
});

test("findEconomyPrices returns each exterior's price as a number", async () => {
  findMany.mockResolvedValueOnce([row("FN", "12.345678"), row("FT", "3")]);
  expect(await findEconomyPrices({ id: 244, statTrak: false })).toEqual([
    { approximate: false, exterior: "FN", price: 12.345678 },
    { approximate: false, exterior: "FT", price: 3 }
  ]);
});

test("findEconomyPrices keeps whether the snapshot approximated a price", async () => {
  findMany.mockResolvedValueOnce([row("FN", "1052.64", { approximate: true })]);
  expect(await findEconomyPrices({ id: 1345, statTrak: false })).toEqual([
    { approximate: true, exterior: "FN", price: 1052.64 }
  ]);
});

test("findEconomyPrices returns an item without wear's listing without exterior", async () => {
  findMany.mockResolvedValueOnce([row(null, "0.5")]);
  expect(await findEconomyPrices({ id: 11422, statTrak: false })).toEqual([
    { approximate: false, exterior: null, price: 0.5 }
  ]);
});

test("findEconomyPrices keeps only listings matching StatTrak", async () => {
  const rows = [row("FN", "10"), row("MW", "30", { statTrak: true })];
  findMany.mockResolvedValueOnce(rows);
  expect(await findEconomyPrices({ id: 244, statTrak: false })).toEqual([
    { approximate: false, exterior: "FN", price: 10 }
  ]);
  findMany.mockResolvedValueOnce(rows);
  expect(await findEconomyPrices({ id: 244, statTrak: true })).toEqual([
    { approximate: false, exterior: "MW", price: 30 }
  ]);
});

test("findEconomyPrices approximates a StatTrak item without StatTrak listings by its regular listings", async () => {
  findMany.mockResolvedValueOnce([row("FN", "10"), row("FT", "3")]);
  expect(await findEconomyPrices({ id: 244, statTrak: true })).toEqual([
    { approximate: true, exterior: "FN", price: 10 },
    { approximate: true, exterior: "FT", price: 3 }
  ]);
});
