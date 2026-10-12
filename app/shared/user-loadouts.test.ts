/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2_ITEMS,
  CS2Economy,
  CS2Inventory,
  CS2Team
} from "@ianlucas/cs2-lib";
import { english } from "@ianlucas/cs2-lib/translations/english";
import { expect, test } from "vitest";
import { SyncAction } from "~/data/sync";
import { getInventoryItemIds, getLoadoutItem } from "./loadout";
import {
  LoadoutAction,
  UserLoadouts,
  applyLoadoutAction,
  detachRemovedItems,
  getLoadoutsUsingItem
} from "./user-loadouts";

CS2Economy.load({
  items: CS2_ITEMS,
  language: english
});

const NOVA_SKIN_ID = 914;
const LOADOUT_ID = "00000000-0000-4000-8000-000000000000";

function apply(
  actions: LoadoutAction[],
  {
    inventory = new CS2Inventory(),
    maxLoadouts = 10,
    state = { activeLoadoutId: null, loadouts: [] }
  }: {
    inventory?: CS2Inventory;
    maxLoadouts?: number;
    state?: UserLoadouts;
  } = {}
) {
  return actions.reduce(
    (current, action) =>
      applyLoadoutAction(current, action, { inventory, maxLoadouts }),
    state
  );
}

const create: LoadoutAction = {
  type: SyncAction.LoadoutCreate,
  id: LOADOUT_ID,
  name: "Main"
};

test("creating a loadout respects the limit", () => {
  expect(apply([create]).loadouts).toHaveLength(1);
  expect(() =>
    apply([create, { ...create, id: crypto.randomUUID() }], { maxLoadouts: 1 })
  ).toThrow();
  expect(() => apply([create, create])).toThrow();
});

test("deleting the loadout in use stops using it", () => {
  const state = apply([
    create,
    { type: SyncAction.LoadoutUse, id: LOADOUT_ID },
    { type: SyncAction.LoadoutDelete, id: LOADOUT_ID }
  ]);
  expect(state).toEqual({ activeLoadoutId: null, loadouts: [] });
  expect(() =>
    apply([{ type: SyncAction.LoadoutUse, id: LOADOUT_ID }])
  ).toThrow();
});

test("loadout actions reject invalid placements", () => {
  const inventory = new CS2Inventory().add({ id: NOVA_SKIN_ID });
  const action: LoadoutAction = {
    type: SyncAction.LoadoutPlace,
    id: LOADOUT_ID,
    item: { type: "inventory", uid: 0 },
    slot: "smg0",
    team: CS2Team.T
  };
  const state = apply([create, action], { inventory });
  expect(getLoadoutItem(state.loadouts[0].loadout, CS2Team.T, "smg0")).toEqual({
    type: "inventory",
    uid: 0
  });
  expect(() =>
    apply([create, { ...action, slot: "rifle0" }], { inventory })
  ).toThrow();
  expect(() =>
    apply([create, { ...action, item: { type: "inventory", uid: 1 } }], {
      inventory
    })
  ).toThrow();
});

test("importing equipped items only changes that loadout", () => {
  const inventory = new CS2Inventory()
    .add({ id: NOVA_SKIN_ID })
    .equip(0, CS2Team.T);
  const other = { ...create, id: crypto.randomUUID() };
  const state = apply(
    [create, other, { type: SyncAction.LoadoutImportEquipped, id: LOADOUT_ID }],
    { inventory }
  );
  expect(getLoadoutItem(state.loadouts[0].loadout, CS2Team.T, "smg0")).toEqual({
    type: "inventory",
    uid: 0
  });
  expect(state.loadouts[1]).toEqual(apply([other]).loadouts[0]);
});

test("detachRemovedItems only touches loadouts using removed items", () => {
  const inventory = new CS2Inventory().add({ id: NOVA_SKIN_ID });
  const state = apply(
    [
      create,
      { ...create, id: crypto.randomUUID(), name: "Other" },
      {
        type: SyncAction.LoadoutPlace,
        id: LOADOUT_ID,
        item: { type: "inventory", uid: 0 },
        slot: "smg0",
        team: CS2Team.T
      }
    ],
    { inventory }
  );
  expect(getLoadoutsUsingItem(state, 0).map(({ name }) => name)).toEqual([
    "Main"
  ]);
  const previousItemIds = getInventoryItemIds(inventory);
  expect(detachRemovedItems(state, previousItemIds, previousItemIds)).toBe(
    state
  );
  inventory.remove(0);
  const detached = detachRemovedItems(
    state,
    getInventoryItemIds(inventory),
    previousItemIds
  );
  expect(getLoadoutsUsingItem(detached, 0)).toEqual([]);
  expect(detached.loadouts[1]).toBe(state.loadouts[1]);
});
