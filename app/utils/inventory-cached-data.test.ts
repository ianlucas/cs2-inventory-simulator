/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2_INVENTORY_VERSION,
  CS2_ITEMS,
  CS2Economy
} from "@ianlucas/cs2-lib";
import { english } from "@ianlucas/cs2-lib/translations";
import { beforeEach, expect, test } from "vitest";
import { getCachedInventoryData } from "./inventory-cached-data";

CS2Economy.load({
  items: CS2_ITEMS,
  language: english
});

const AK47_ID = 4;

beforeEach(() => {
  window.localStorage.clear();
});

test("getCachedInventoryData reads the cached inventory", () => {
  window.localStorage.setItem(
    "inventoryItems",
    JSON.stringify({
      items: { 0: { id: AK47_ID, nameTag: "keeper" } },
      version: CS2_INVENTORY_VERSION
    })
  );
  expect(getCachedInventoryData()?.items[0].id).toBe(AK47_ID);
});

test("getCachedInventoryData discards an unreadable cache entry", () => {
  window.localStorage.setItem("inventoryItems", "not json");
  expect(getCachedInventoryData()).toBeUndefined();
  expect(window.localStorage.getItem("inventoryItems")).toBeNull();
});
