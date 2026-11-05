/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2_INVENTORY_VERSION } from "@ianlucas/cs2-lib";
import { beforeEach, expect, test } from "vitest";
import { loadEconomy } from "~/test-utils";
import { getCachedInventoryData } from "./inventory-storage";

loadEconomy();

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
