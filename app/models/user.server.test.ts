/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2_ITEMS, CS2Economy } from "@ianlucas/cs2-lib";
import { english } from "@ianlucas/cs2-lib/translations";
import { beforeEach, expect, test, vi } from "vitest";
import { loadOrCreateUserInventory } from "./user.server";

const { getMaxItems, getStorageUnitMaxItems } = vi.hoisted(() => ({
  getMaxItems: vi.fn(async () => 64),
  getStorageUnitMaxItems: vi.fn(async () => 8)
}));

vi.mock("~/db.server", () => ({ prisma: {} }));
vi.mock("./rule.server", () => ({
  inventoryMaxItems: { for: () => ({ get: getMaxItems }) },
  inventoryStorageUnitMaxItems: { for: () => ({ get: getStorageUnitMaxItems }) }
}));

CS2Economy.load({
  items: CS2_ITEMS,
  language: english
});

beforeEach(() => {
  getMaxItems.mockClear();
  getStorageUnitMaxItems.mockClear();
});

test("loadOrCreateUserInventory uses provided options without fetching rules", async () => {
  const inventory = await loadOrCreateUserInventory("76561197960287930", null, {
    maxItems: 5,
    storageUnitMaxItems: 2
  });
  expect(inventory.options.maxItems).toBe(5);
  expect(inventory.options.storageUnitMaxItems).toBe(2);
  expect(getMaxItems).not.toHaveBeenCalled();
  expect(getStorageUnitMaxItems).not.toHaveBeenCalled();
});

test("loadOrCreateUserInventory falls back to the user's rules", async () => {
  const inventory = await loadOrCreateUserInventory("76561197960287930", null);
  expect(inventory.options.maxItems).toBe(64);
  expect(inventory.options.storageUnitMaxItems).toBe(8);
  expect(getMaxItems).toHaveBeenCalled();
  expect(getStorageUnitMaxItems).toHaveBeenCalled();
});
