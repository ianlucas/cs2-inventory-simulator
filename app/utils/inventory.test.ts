/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, CS2_ITEMS } from "@ianlucas/cs2-lib";
import { english } from "@ianlucas/cs2-lib/translations";
import { expect, test } from "vitest";
import { hasInventoryContent, parseInventory } from "./inventory";

CS2Economy.load({ items: CS2_ITEMS, language: english });

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

test("parseInventory heals a recoverable field instead of wiping the inventory", () => {
  const raw = JSON.stringify({
    items: {
      "0": {
        id: 14264,
        stickers: {
          "0": { id: 14563, rotation: 333, schema: 1, x: -0.04, y: 0.097 }
        }
      }
    },
    version: 1
  });
  const data = parseInventory(raw);
  expect(data?.items["0"]?.stickers?.["0"].rotation).toBe(-27);
});

test("parseInventory still gives up when a field can't be healed", () => {
  const raw = JSON.stringify({
    items: {
      "0": { id: 14264, seed: 999999999 }
    },
    version: 1
  });
  expect(parseInventory(raw)).toBeUndefined();
});
