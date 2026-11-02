/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { expect, test } from "vitest";
import { filterItemComboboxOptions } from "./item-combobox";

const OPTIONS = [
  {
    description: "chopper gets a double kill on Mirage.",
    id: 1,
    label: "chopper Double Kill"
  },
  { id: 2, label: "Sticker | Team Spirit (Gold) | Austin 2025" },
  { id: 3, label: "Sticker | MOUZ (Gold) | Austin 2025" }
];

test("filterItemComboboxOptions keeps every option for an empty query", () => {
  expect(filterItemComboboxOptions(OPTIONS, " ")).toEqual(OPTIONS);
});

test("filterItemComboboxOptions matches every word in any order", () => {
  expect(
    filterItemComboboxOptions(OPTIONS, "gold mouz").map(({ id }) => id)
  ).toEqual([3]);
});

test("filterItemComboboxOptions also matches the description", () => {
  expect(
    filterItemComboboxOptions(OPTIONS, "MIRAGE").map(({ id }) => id)
  ).toEqual([1]);
});
