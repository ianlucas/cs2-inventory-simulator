/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2_ITEMS, CS2Economy, CS2ItemType } from "@ianlucas/cs2-lib";
import { english } from "@ianlucas/cs2-lib/translations/english";
import { expect, test } from "vitest";
import {
  createItemHideFilter,
  EconomyListingPrice,
  getEconomyPriceQuery,
  selectEconomyPrice
} from "./economy";
import { createFakeInventoryItemFromBase } from "./inventory";

CS2Economy.load({
  items: CS2_ITEMS,
  language: english
});

const AK47_ID = 4;
const FALLEN_COLOGNE_2015_ID = 2226;
const AK47_ASIIMOV_ID = 244;
const KARAMBIT_VANILLA_ID = 41;
const KILOWATT_CASE_ID = 11422;

const noHideRules = {
  hideCategory: [],
  hideType: [],
  hideModel: [],
  hideId: []
};

test("createItemHideFilter hides a type in hideFilterType", () => {
  const filter = createItemHideFilter({
    ...noHideRules,
    hideFilterType: [CS2ItemType.Sticker]
  });
  expect(filter(CS2Economy.get(FALLEN_COLOGNE_2015_ID))).toBe(false);
  expect(filter(CS2Economy.get(AK47_ID))).toBe(true);
});

test("createItemHideFilter keeps every type without hideFilterType", () => {
  const filter = createItemHideFilter(noHideRules);
  expect(filter(CS2Economy.get(FALLEN_COLOGNE_2015_ID))).toBe(true);
  expect(filter(CS2Economy.get(AK47_ID))).toBe(true);
});

test("createItemHideFilter hides a type in hideType", () => {
  const filter = createItemHideFilter({
    ...noHideRules,
    hideType: [CS2ItemType.Sticker]
  });
  expect(filter(CS2Economy.get(FALLEN_COLOGNE_2015_ID))).toBe(false);
  expect(filter(CS2Economy.get(AK47_ID))).toBe(true);
});

test("getEconomyPriceQuery prices an item by its id and StatTrak", () => {
  expect(
    getEconomyPriceQuery(
      createFakeInventoryItemFromBase({
        id: AK47_ASIIMOV_ID,
        statTrak: 0,
        wear: 0.2
      })
    )
  ).toEqual({ id: AK47_ASIIMOV_ID, statTrak: true });
  expect(
    getEconomyPriceQuery(
      createFakeInventoryItemFromBase({ id: KILOWATT_CASE_ID })
    )
  ).toEqual({ id: KILOWATT_CASE_ID, statTrak: false });
});

const asiimov = (wear: number) =>
  createFakeInventoryItemFromBase({ id: AK47_ASIIMOV_ID, wear });

function listing(
  exterior: EconomyListingPrice["exterior"],
  price: number,
  approximate = false
): EconomyListingPrice {
  return { approximate, exterior, price };
}

test("selectEconomyPrice picks the price of the item's exterior", () => {
  const listings = [listing("FN", 10), listing("FT", 3)];
  expect(selectEconomyPrice(listings, asiimov(0.06))).toEqual({
    isApproximate: false,
    price: 10
  });
  expect(selectEconomyPrice(listings, asiimov(0.2))).toEqual({
    isApproximate: false,
    price: 3
  });
});

test("selectEconomyPrice approximates with the exterior nearest the wear", () => {
  const listings = [listing("FN", 10), listing("FT", 3)];
  expect(selectEconomyPrice(listings, asiimov(0.08))).toEqual({
    isApproximate: true,
    price: 10
  });
  expect(selectEconomyPrice(listings, asiimov(0.149))).toEqual({
    isApproximate: true,
    price: 3
  });
  expect(selectEconomyPrice([listing("BS", 1)], asiimov(0.06))).toEqual({
    isApproximate: true,
    price: 1
  });
});

test("selectEconomyPrice keeps a listing the snapshot approximated approximate", () => {
  expect(selectEconomyPrice([listing("FN", 10, true)], asiimov(0.06))).toEqual({
    isApproximate: true,
    price: 10
  });
  expect(
    selectEconomyPrice(
      [listing(null, 1.25, true)],
      createFakeInventoryItemFromBase({ id: KARAMBIT_VANILLA_ID })
    )
  ).toEqual({ isApproximate: true, price: 1.25 });
});

test("selectEconomyPrice picks the listing without exterior for an item without wear", () => {
  expect(
    selectEconomyPrice(
      [listing(null, 1.25)],
      createFakeInventoryItemFromBase({ id: KARAMBIT_VANILLA_ID })
    )
  ).toEqual({ isApproximate: false, price: 1.25 });
});

test("selectEconomyPrice is null without a matching listing", () => {
  expect(selectEconomyPrice([], asiimov(0.06))).toEqual({
    isApproximate: false,
    price: null
  });
  expect(selectEconomyPrice([listing(null, 1)], asiimov(0.06))).toEqual({
    isApproximate: false,
    price: null
  });
  expect(
    selectEconomyPrice(
      [listing("FN", 1)],
      createFakeInventoryItemFromBase({ id: KILOWATT_CASE_ID })
    )
  ).toEqual({ isApproximate: false, price: null });
});
