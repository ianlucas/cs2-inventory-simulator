/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2_INVENTORY_VERSION,
  CS2Economy,
  CS2Inventory,
  ensure
} from "@ianlucas/cs2-lib";
import { expect, test } from "vitest";
import { loadEconomy } from "~/test-utils";
import {
  canReceiveStickers,
  CHARM_DETACHMENTS_DISPLAY_UID,
  editInventoryItem,
  getCharmDetachmentsToDisplay,
  hasInventoryContent,
  loadOrCreateInventory,
  safeLoadInventory
} from "./inventory";

loadEconomy();

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

test("getCharmDetachmentsToDisplay shows a free charm detachment by default", () => {
  const items = getCharmDetachmentsToDisplay(new CS2Inventory());
  expect(items).toHaveLength(1);
  expect(items[0].uid).toBe(CHARM_DETACHMENTS_DISPLAY_UID);
  expect(items[0].item.isCharmDetachment()).toBe(true);
});

test("getCharmDetachmentsToDisplay hides the free charm detachment with hideFreeItems", () => {
  expect(getCharmDetachmentsToDisplay(new CS2Inventory(), true)).toEqual([]);
});

test("getCharmDetachmentsToDisplay hides the free charm detachment when one is owned", () => {
  const inventory = new CS2Inventory().add({
    id: CS2Economy.getCharmDetachment().id
  });
  expect(getCharmDetachmentsToDisplay(inventory)).toEqual([]);
});

const souvenirWeapon = ensure(
  Array.from(CS2Economy.items.values()).find(
    (item) =>
      item.isWeapon() &&
      item.getSouvenirSources().some(({ container }) => container === undefined)
  )
);
const highlightCharm = ensure(
  Array.from(CS2Economy.items.values()).find(
    (item) => item.isKeychain() && item.hasHighlights()
  )
);

test("editInventoryItem turns the Souvenir toggle into the souvenir flag", () => {
  const { teams } = ensure(
    souvenirWeapon
      .getSouvenirSources()
      .find(({ container }) => container === undefined)
  );
  const stickers = { 0: { id: teams[0].sticker.id } };
  const inventory = new CS2Inventory();
  inventory.add({ id: souvenirWeapon.id });
  editInventoryItem(inventory, 0, { souvenir: true, stickers });
  expect(inventory.get(0).souvenir).toBe(true);
  editInventoryItem(inventory, 0, { souvenir: false, stickers });
  expect(inventory.get(0).souvenir).toBeUndefined();
  expect(inventory.get(0).stickers?.get(0)?.id).toBe(stickers[0].id);
});

test("editInventoryItem sets a loose charm's highlight", () => {
  const [first, second] = highlightCharm.getHighlights();
  const inventory = new CS2Inventory();
  inventory.add({ id: highlightCharm.id, highlight: first.id });
  editInventoryItem(inventory, 0, { highlight: second.id });
  expect(inventory.get(0).highlight).toBe(second.id);
});

test("canReceiveStickers leaves souvenirs out", () => {
  const inventory = new CS2Inventory();
  inventory.add({ id: souvenirWeapon.id });
  inventory.add({ id: souvenirWeapon.id, souvenir: true });
  inventory.add({ id: FALLEN_COLOGNE_2015_ID });
  expect(canReceiveStickers(inventory.get(0))).toBe(true);
  expect(canReceiveStickers(inventory.get(1))).toBe(false);
  expect(canReceiveStickers(inventory.get(2))).toBe(false);
});
