/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { expect, test } from "vitest";
import { hasInventoryContent } from "./inventory";

test("hasInventoryContent is false when there is nothing to lose", () => {
  expect(hasInventoryContent(null)).toBe(false);
  expect(hasInventoryContent("")).toBe(false);
  expect(hasInventoryContent("   ")).toBe(false);
  expect(hasInventoryContent("{}")).toBe(false);
  expect(hasInventoryContent(`{"items":{},"version":1}`)).toBe(false);
  expect(hasInventoryContent(`{"items":null,"version":1}`)).toBe(false);
});

test("hasInventoryContent is true when items are held", () => {
  expect(hasInventoryContent(`{"items":{"0":{"id":360}},"version":1}`)).toBe(
    true
  );
});

test("hasInventoryContent is true for anything not provably empty", () => {
  expect(hasInventoryContent("not json")).toBe(true);
  expect(hasInventoryContent(`{"items":`)).toBe(true);
  expect(hasInventoryContent("null")).toBe(true);
  expect(hasInventoryContent("[]")).toBe(true);
});
