/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { expect, test } from "vitest";
import { clientInventoryItemShape, itemEditorAttributesShape } from "./shapes";

test("an inventory item is a souvenir only through a true flag", () => {
  expect(
    clientInventoryItemShape.parse({ id: 1, souvenir: true }).souvenir
  ).toBe(true);
  expect(() =>
    clientInventoryItemShape.parse({ id: 1, souvenir: false })
  ).toThrow();
});

test("an inventory item carries its own and its charms' highlights", () => {
  expect(
    clientInventoryItemShape.parse({
      highlight: 2,
      id: 1,
      keychains: { 0: { highlight: 4, id: 3 } }
    })
  ).toEqual({ highlight: 2, id: 1, keychains: { 0: { highlight: 4, id: 3 } } });
});

test("the editor sends Souvenir as a toggle and a loose charm's highlight", () => {
  expect(
    itemEditorAttributesShape.parse({ highlight: 2, souvenir: false })
  ).toEqual({ highlight: 2, souvenir: false });
});
