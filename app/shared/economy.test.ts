/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2_ITEMS, CS2Economy, CS2ItemType } from "@ianlucas/cs2-lib";
import { english } from "@ianlucas/cs2-lib/translations/english";
import { expect, test } from "vitest";
import {
  createItemHideFilter,
  getEconomyPriceQuery,
  pickEconomyPrice
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

test("getEconomyPriceQuery prices a skin by its exterior and StatTrak", () => {
  expect(
    getEconomyPriceQuery(
      createFakeInventoryItemFromBase({
        id: AK47_ASIIMOV_ID,
        statTrak: 0,
        wear: 0.2
      })
    )
  ).toEqual({ exterior: "FT", id: AK47_ASIIMOV_ID, statTrak: true });
  expect(
    getEconomyPriceQuery(
      createFakeInventoryItemFromBase({ id: AK47_ASIIMOV_ID, wear: 0.06 })
    )
  ).toEqual({ exterior: "FN", id: AK47_ASIIMOV_ID, statTrak: false });
});

test("getEconomyPriceQuery prices an item without wear without an exterior", () => {
  expect(
    getEconomyPriceQuery(
      createFakeInventoryItemFromBase({ id: KARAMBIT_VANILLA_ID, statTrak: 0 })
    )
  ).toEqual({ exterior: undefined, id: KARAMBIT_VANILLA_ID, statTrak: true });
  expect(
    getEconomyPriceQuery(
      createFakeInventoryItemFromBase({ id: KILOWATT_CASE_ID })
    )
  ).toEqual({ exterior: undefined, id: KILOWATT_CASE_ID, statTrak: false });
});

test("pickEconomyPrice falls back from the shortest window to the longest", () => {
  const prices = {
    avgPrice24h: 1,
    avgPrice7d: 7,
    avgPrice30d: 30,
    avgPrice90d: 90
  };
  expect(pickEconomyPrice(prices)).toBe(1);
  expect(pickEconomyPrice({ ...prices, avgPrice24h: null })).toBe(7);
  expect(
    pickEconomyPrice({ ...prices, avgPrice24h: null, avgPrice7d: null })
  ).toBe(30);
  expect(
    pickEconomyPrice({
      ...prices,
      avgPrice24h: null,
      avgPrice7d: null,
      avgPrice30d: null
    })
  ).toBe(90);
});

test("pickEconomyPrice is null without any price", () => {
  expect(
    pickEconomyPrice({
      avgPrice24h: null,
      avgPrice7d: null,
      avgPrice30d: null,
      avgPrice90d: null
    })
  ).toBeNull();
});
