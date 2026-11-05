/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2ItemType } from "@ianlucas/cs2-lib";
import { expect, test } from "vitest";
import { loadEconomy } from "~/test-utils";
import { getAllPaidItems } from "./economy-filters";

loadEconomy();

test("getAllPaidItems leaves out items that can't be crafted on their own", () => {
  const types = new Set(getAllPaidItems().map(({ type }) => type));
  expect(types.has(CS2ItemType.Stub)).toBe(false);
  expect(types.has(CS2ItemType.Highlight)).toBe(false);
});

test("getAllPaidItems only lists items with an image", () => {
  for (const item of getAllPaidItems()) {
    expect(() => item.getImageUrl()).not.toThrow();
  }
});
