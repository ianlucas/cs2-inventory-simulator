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
import { expect, test } from "vitest";
import {
  hasInventoryContent,
  loadOrCreateInventory,
  safeLoadInventory
} from "./inventory";

CS2Economy.load({
  items: CS2_ITEMS,
  language: english
});

const AK47_ID = 4;
const FALLEN_COLOGNE_2015_ID = 2226;

test("safeLoadInventory turns stored bytes into an inventory", () => {
  const inventory = safeLoadInventory(
    JSON.stringify({
      items: { 0: { id: AK47_ID, nameTag: "my rifle" } },
      version: CS2_INVENTORY_VERSION
    })
  );
  expect(inventory?.size()).toBe(1);
  expect(inventory?.get(0).id).toBe(AK47_ID);
  expect(inventory?.get(0).nameTag).toBe("my rifle");
});

test("safeLoadInventory migrates a legacy document to the current format", () => {
  const inventory = safeLoadInventory(
    JSON.stringify({
      items: {
        0: {
          id: AK47_ID,
          stickers: { 0: { id: FALLEN_COLOGNE_2015_ID, rotation: 270 } }
        }
      },
      version: 1
    })
  );
  expect(inventory?.get(0).stickers?.get(0)?.rotation).toBe(-90);
});

test("safeLoadInventory drops a bad item and keeps the rest", () => {
  const UNKNOWN_ID = 999999;
  const inventory = safeLoadInventory(
    JSON.stringify({
      items: {
        0: { id: AK47_ID, nameTag: "keeper" },
        1: { id: UNKNOWN_ID }
      },
      version: CS2_INVENTORY_VERSION
    })
  );
  expect(inventory?.size()).toBe(1);
  expect(inventory?.get(0).id).toBe(AK47_ID);
  expect(inventory?.loadChanges?.dropped).toEqual([
    { uid: 1, id: UNKNOWN_ID, reason: "unknown-item" }
  ]);
});

test("safeLoadInventory drops a default item holding nothing paid", () => {
  const inventory = safeLoadInventory(
    JSON.stringify({
      items: {
        0: { id: AK47_ID },
        1: { id: AK47_ID, nameTag: "my rifle" }
      },
      version: CS2_INVENTORY_VERSION
    })
  );
  expect(inventory?.size()).toBe(1);
  expect(inventory?.get(1).nameTag).toBe("my rifle");
  expect(inventory?.loadChanges?.dropped).toEqual([
    { uid: 0, id: AK47_ID, reason: "policy" }
  ]);
});

test("safeLoadInventory is undefined for unreadable documents", () => {
  expect(safeLoadInventory(null)).toBeUndefined();
  expect(safeLoadInventory("")).toBeUndefined();
  expect(safeLoadInventory("not json")).toBeUndefined();
  expect(
    safeLoadInventory(
      JSON.stringify({ items: {}, version: CS2_INVENTORY_VERSION + 1 })
    )
  ).toBeUndefined();
});

function makeRifles(count: number) {
  return Object.fromEntries(
    Array.from({ length: count }, (_, uid) => [
      uid,
      { id: AK47_ID, nameTag: `rifle ${uid}` }
    ])
  );
}

test("safeLoadInventory truncates items above the default cap", () => {
  const inventory = safeLoadInventory(
    JSON.stringify({ items: makeRifles(257), version: CS2_INVENTORY_VERSION })
  );
  expect(inventory?.size()).toBe(256);
  expect(inventory?.loadChanges?.dropped).toEqual([
    { uid: 256, id: AK47_ID, reason: "policy" }
  ]);
});

test("safeLoadInventory keeps every item when maxItems is raised", () => {
  const inventory = safeLoadInventory(
    JSON.stringify({ items: makeRifles(257), version: CS2_INVENTORY_VERSION }),
    { maxItems: 512 }
  );
  expect(inventory?.size()).toBe(257);
  expect(inventory?.loadChanges?.dropped ?? []).toEqual([]);
});

test("loadOrCreateInventory returns the loaded inventory when readable", () => {
  const inventory = loadOrCreateInventory(
    JSON.stringify({
      items: { 0: { id: AK47_ID, nameTag: "my rifle" } },
      version: CS2_INVENTORY_VERSION
    })
  );
  expect(inventory.size()).toBe(1);
  expect(inventory.get(0).nameTag).toBe("my rifle");
});

test("loadOrCreateInventory falls back to an empty inventory", () => {
  expect(loadOrCreateInventory(null).size()).toBe(0);
  expect(loadOrCreateInventory("not json").size()).toBe(0);
});

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
