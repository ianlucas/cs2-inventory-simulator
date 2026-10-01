/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2_ITEMS, CS2Economy, CS2ItemType } from "@ianlucas/cs2-lib";
import { english } from "@ianlucas/cs2-lib/translations/english";
import { expect, test } from "vitest";
import { createItemHideFilter } from "./economy";

CS2Economy.load({
  items: CS2_ITEMS,
  language: english
});

const AK47_ID = 4;
const FALLEN_COLOGNE_2015_ID = 2226;

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
