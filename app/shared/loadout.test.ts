/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2_ITEMS,
  CS2Economy,
  CS2Inventory,
  CS2ItemType,
  CS2Team,
  ensure
} from "@ianlucas/cs2-lib";
import { english } from "@ianlucas/cs2-lib/translations/english";
import { expect, test } from "vitest";
import {
  LOADOUT_SLOTS,
  Loadout,
  LoadoutSlot,
  LoadoutTeam,
  canPlace,
  canRemoveSlot,
  canResetSlot,
  canResetSlotFinish,
  createDefaultLoadout,
  createSnapshot,
  detachItems,
  getEconomyItem,
  getInventoryItemIds,
  getItemGroup,
  getLoadoutEntries,
  getLoadoutItem,
  getLoadoutItemEquipped,
  getSideSlots,
  importEquipped,
  place,
  removeSlot,
  resetSlot,
  resetSlotFinish,
  resolveSideSlot
} from "./loadout";
import { LOADOUT_PRICES } from "./loadout-defaults";

CS2Economy.load({
  items: CS2_ITEMS,
  language: english
});

const AK47_ID = 4;
const GLOCK_ID = 3;
const USP_ID = 32;
const DEAGLE_ID = 0;
const NOVA_ID = 25;
const M4A4_ID = 11;
const T_KNIFE_ID = 36;
const NOVA_SKIN_ID = 914;
const M4A4_SKIN_ID = 450;
const KARAMBIT_SKIN_ID = 1325;
const GRAFFITI_ID = 9543;
const COIN_ID = 8683;
const DEFAULT_CT_AGENT_ID = 28169;
const DEFAULT_T_AGENT_ID = 28168;

const EMPTY_INVENTORY = new CS2Inventory();

function createInventory(...ids: number[]) {
  const inventory = new CS2Inventory();
  for (const id of ids) {
    inventory.add({ id });
  }
  return inventory;
}

function itemAt(
  loadout: Loadout,
  team: LoadoutTeam,
  slot: LoadoutSlot,
  inventory = EMPTY_INVENTORY
) {
  const item = getLoadoutItem(loadout, team, slot);
  return item !== undefined ? getEconomyItem(inventory, item) : undefined;
}

function placed(
  inventory: CS2Inventory,
  team: LoadoutTeam,
  slot: LoadoutSlot,
  uid: number,
  loadout = createDefaultLoadout()
) {
  return ensure(
    place(loadout, inventory, team, slot, { type: "inventory", uid })
  ).loadout;
}

test("createDefaultLoadout follows the game's factory slots", () => {
  const loadout = createDefaultLoadout();
  expect(itemAt(loadout, CS2Team.CT, "secondary0")?.modelKey).toBe("hkp2000");
  expect(itemAt(loadout, CS2Team.T, "secondary0")?.modelKey).toBe("glock");
  expect(itemAt(loadout, CS2Team.CT, "smg4")?.modelKey).toBe("mp9");
  expect(itemAt(loadout, CS2Team.T, "rifle1")?.modelKey).toBe("ak47");
  expect(itemAt(loadout, CS2Team.T, "melee")?.modelKey).toBe("knife_t");
  expect(itemAt(loadout, CS2Team.CT, "customplayer")?.id).toBe(
    DEFAULT_CT_AGENT_ID
  );
  expect(itemAt(loadout, CS2Team.T, "customplayer")?.id).toBe(
    DEFAULT_T_AGENT_ID
  );
  expect(
    canResetSlot(loadout, EMPTY_INVENTORY, CS2Team.CT, "customplayer")
  ).toBe(false);
  expect(loadout.ct.c4).toBeUndefined();
  expect(loadout.t.c4).toBeDefined();
  expect(loadout.musicKit).toBeUndefined();
});

test("createDefaultLoadout only holds free snapshots", () => {
  const loadout = createDefaultLoadout();
  for (const team of [CS2Team.CT, CS2Team.T] as const) {
    for (const slot of LOADOUT_SLOTS) {
      const item = getLoadoutItem(loadout, team, slot);
      if (item !== undefined) {
        expect(item.type).toBe("snapshot");
        expect(itemAt(loadout, team, slot)?.isDefault).toBe(true);
      }
    }
  }
});

test("canPlace matches the slot's group and the item's team", () => {
  const ak47 = CS2Economy.getById(AK47_ID);
  const m4a4 = CS2Economy.getById(M4A4_ID);
  const usp = CS2Economy.getById(USP_ID);
  const deagle = CS2Economy.getById(DEAGLE_ID);
  expect(canPlace(CS2Team.T, "rifle3", ak47)).toBe(true);
  expect(canPlace(CS2Team.CT, "rifle3", ak47)).toBe(false);
  expect(canPlace(CS2Team.CT, "rifle0", m4a4)).toBe(true);
  expect(canPlace(CS2Team.CT, "smg0", m4a4)).toBe(false);
  expect(canPlace(CS2Team.CT, "secondary0", usp)).toBe(true);
  expect(canPlace(CS2Team.CT, "secondary2", usp)).toBe(false);
  expect(canPlace(CS2Team.CT, "secondary0", deagle)).toBe(false);
  expect(canPlace(CS2Team.CT, "secondary2", deagle)).toBe(true);
  expect(canPlace(CS2Team.T, "smg2", CS2Economy.getById(NOVA_SKIN_ID))).toBe(
    true
  );
});

test("canPlace rejects sealed graffiti", () => {
  const inventory = createInventory(GRAFFITI_ID);
  expect(canPlace(CS2Team.T, "spray0", inventory.get(0))).toBe(false);
  inventory.unsealItem(0);
  expect(canPlace(CS2Team.T, "spray0", inventory.get(0))).toBe(true);
});

test("resolveSideSlot routes items to their side slot", () => {
  expect(resolveSideSlot(CS2Team.T, CS2Economy.getById(KARAMBIT_SKIN_ID))).toBe(
    "melee"
  );
  expect(resolveSideSlot(CS2Team.CT, CS2Economy.getById(GRAFFITI_ID))).toBe(
    "spray0"
  );
  expect(resolveSideSlot(CS2Team.CT, CS2Economy.getById(COIN_ID))).toBe(
    "flair0"
  );
  expect(resolveSideSlot(CS2Team.CT, CS2Economy.getById(AK47_ID))).toBe(
    undefined
  );
  expect(getSideSlots(CS2Team.CT)).not.toContain("c4");
});

test("place puts a reference to the inventory item in the slot", () => {
  const loadout = placed(createInventory(NOVA_SKIN_ID), CS2Team.T, "smg0", 0);
  expect(getLoadoutItem(loadout, CS2Team.T, "smg0")).toEqual({
    type: "inventory",
    uid: 0
  });
});

test("place only takes snapshots of free items", () => {
  const loadout = createDefaultLoadout();
  expect(
    place(
      loadout,
      EMPTY_INVENTORY,
      CS2Team.T,
      "smg0",
      createSnapshot(NOVA_SKIN_ID)
    )
  ).toBe(undefined);
  expect(
    place(loadout, EMPTY_INVENTORY, CS2Team.T, "smg0", createSnapshot(NOVA_ID))
  ).toBeDefined();
});

test("place swaps a weapon already in another slot", () => {
  const inventory = createInventory(NOVA_SKIN_ID);
  const result = place(createDefaultLoadout(), inventory, CS2Team.T, "smg3", {
    type: "inventory",
    uid: 0
  });
  expect(result?.swappedSlot).toBe("smg0");
  expect(itemAt(ensure(result).loadout, CS2Team.T, "smg3", inventory)?.id).toBe(
    NOVA_SKIN_ID
  );
  expect(itemAt(ensure(result).loadout, CS2Team.T, "smg0")?.modelKey).toBe(
    "p90"
  );
});

test("place replaces the finish of the same weapon in place", () => {
  const inventory = createInventory(NOVA_SKIN_ID);
  const result = place(createDefaultLoadout(), inventory, CS2Team.CT, "smg0", {
    type: "inventory",
    uid: 0
  });
  expect(result?.swappedSlot).toBeUndefined();
  expect(
    itemAt(ensure(result).loadout, CS2Team.CT, "smg0", inventory)?.id
  ).toBe(NOVA_SKIN_ID);
});

test("place rejects items that do not fit", () => {
  const loadout = createDefaultLoadout();
  expect(
    place(
      loadout,
      EMPTY_INVENTORY,
      CS2Team.CT,
      "rifle0",
      createSnapshot(AK47_ID)
    )
  ).toBe(undefined);
  expect(
    place(
      loadout,
      EMPTY_INVENTORY,
      CS2Team.T,
      "secondary1",
      createSnapshot(GLOCK_ID)
    )
  ).toBe(undefined);
  expect(
    place(loadout, EMPTY_INVENTORY, CS2Team.T, "melee", createSnapshot(NOVA_ID))
  ).toBe(undefined);
});

test("place keeps the other team untouched", () => {
  const loadout = createDefaultLoadout();
  expect(
    placed(createInventory(NOVA_SKIN_ID), CS2Team.T, "smg0", 0, loadout).ct
  ).toBe(loadout.ct);
});

test("resetSlot restores the factory weapon of a slot", () => {
  const inventory = createInventory(NOVA_SKIN_ID);
  const swapped = placed(inventory, CS2Team.T, "smg3", 0);
  expect(canResetSlot(swapped, inventory, CS2Team.T, "smg3")).toBe(true);
  const reset = ensure(
    resetSlot(swapped, inventory, CS2Team.T, "smg3")
  ).loadout;
  expect(itemAt(reset, CS2Team.T, "smg3")?.modelKey).toBe("p90");
  expect(itemAt(reset, CS2Team.T, "smg0", inventory)?.id).toBe(NOVA_SKIN_ID);
  expect(canResetSlot(reset, inventory, CS2Team.T, "smg3")).toBe(false);
});

test("resetSlotFinish keeps the weapon and drops its finish", () => {
  const inventory = createInventory(NOVA_SKIN_ID);
  const loadout = placed(inventory, CS2Team.T, "smg0", 0);
  expect(canResetSlotFinish(loadout, CS2Team.T, "smg0")).toBe(true);
  const reset = ensure(
    resetSlotFinish(loadout, inventory, CS2Team.T, "smg0")
  ).loadout;
  expect(getLoadoutItem(reset, CS2Team.T, "smg0")).toEqual(
    createSnapshot(NOVA_ID)
  );
  expect(canResetSlotFinish(reset, CS2Team.T, "smg0")).toBe(false);
});

test("resetSlot restores the team's default knife", () => {
  const inventory = createInventory(KARAMBIT_SKIN_ID);
  const loadout = placed(inventory, CS2Team.T, "melee", 0);
  expect(canResetSlot(loadout, inventory, CS2Team.T, "melee")).toBe(true);
  const reset = ensure(
    resetSlot(loadout, inventory, CS2Team.T, "melee")
  ).loadout;
  expect(itemAt(reset, CS2Team.T, "melee")?.id).toBe(T_KNIFE_ID);
});

test("shared slots are the same for both teams and can be removed", () => {
  const inventory = createInventory(GRAFFITI_ID).unsealItem(0);
  const loadout = placed(inventory, CS2Team.CT, "spray0", 0);
  expect(itemAt(loadout, CS2Team.T, "spray0", inventory)?.id).toBe(GRAFFITI_ID);
  expect(getLoadoutItemEquipped(loadout, 0)).toEqual({
    equipped: true,
    equippedCT: false,
    equippedT: false
  });
  expect(canRemoveSlot(loadout, CS2Team.T, "spray0")).toBe(true);
  expect(canRemoveSlot(loadout, CS2Team.T, "melee")).toBe(false);
  expect(removeSlot(loadout, "spray0").graffiti).toBeUndefined();
});

test("detachItems falls back like the game when items leave the inventory", () => {
  const inventory = createInventory(
    NOVA_SKIN_ID,
    KARAMBIT_SKIN_ID,
    GRAFFITI_ID
  );
  inventory.unsealItem(2);
  const loadout = placed(
    inventory,
    CS2Team.CT,
    "spray0",
    2,
    placed(
      inventory,
      CS2Team.T,
      "melee",
      1,
      placed(inventory, CS2Team.T, "smg2", 0)
    )
  );
  const previousItemIds = getInventoryItemIds(inventory);
  expect(detachItems(loadout, previousItemIds, previousItemIds)).toBe(loadout);
  inventory.removeAll();
  const detached = detachItems(
    loadout,
    getInventoryItemIds(inventory),
    previousItemIds
  );
  expect(getLoadoutItem(detached, CS2Team.T, "smg2")).toEqual(
    createSnapshot(NOVA_ID)
  );
  expect(itemAt(detached, CS2Team.T, "melee")?.id).toBe(T_KNIFE_ID);
  expect(detached.graffiti).toBeUndefined();
});

test("detachItems treats a reused uid as a removed item", () => {
  const inventory = createInventory(NOVA_SKIN_ID);
  const loadout = placed(inventory, CS2Team.T, "smg0", 0);
  const previousItemIds = getInventoryItemIds(inventory);
  inventory.remove(0).add({ id: KARAMBIT_SKIN_ID });
  expect(
    getLoadoutItem(
      detachItems(loadout, getInventoryItemIds(inventory), previousItemIds),
      CS2Team.T,
      "smg0"
    )
  ).toEqual(createSnapshot(NOVA_ID));
});

test("detachItems resets slots pointing to unknown items", () => {
  const loadout = placed(createInventory(NOVA_SKIN_ID), CS2Team.T, "smg3", 0);
  const detached = detachItems(loadout, new Map(), new Map());
  expect(itemAt(detached, CS2Team.T, "smg3")?.modelKey).toBe("p90");
});

test("importEquipped takes the items equipped in the inventory", () => {
  const inventory = createInventory(
    NOVA_SKIN_ID,
    KARAMBIT_SKIN_ID,
    GRAFFITI_ID,
    COIN_ID
  )
    .unsealItem(2)
    .equip(0, CS2Team.T)
    .equip(1, CS2Team.CT)
    .equip(2);
  const imported = importEquipped(
    placed(inventory, CS2Team.CT, "flair0", 3),
    inventory
  );
  expect(getLoadoutItem(imported, CS2Team.T, "smg0")).toEqual({
    type: "inventory",
    uid: 0
  });
  expect(getLoadoutItem(imported, CS2Team.CT, "smg0")).toEqual(
    createSnapshot(NOVA_ID)
  );
  expect(getLoadoutItem(imported, CS2Team.CT, "melee")).toEqual({
    type: "inventory",
    uid: 1
  });
  expect(itemAt(imported, CS2Team.T, "melee")?.id).toBe(T_KNIFE_ID);
  expect(imported.graffiti).toEqual({ type: "inventory", uid: 2 });
  expect(imported.collectible).toBeUndefined();
});

test("importEquipped keeps the grid's weapons and resets the rest to stock", () => {
  const inventory = createInventory(
    NOVA_SKIN_ID,
    KARAMBIT_SKIN_ID,
    M4A4_SKIN_ID
  );
  inventory.equip(2, CS2Team.CT);
  const imported = importEquipped(
    placed(
      inventory,
      CS2Team.T,
      "melee",
      1,
      placed(inventory, CS2Team.T, "smg2", 0)
    ),
    inventory
  );
  expect(getLoadoutItem(imported, CS2Team.T, "smg2")).toEqual(
    createSnapshot(NOVA_ID)
  );
  expect(itemAt(imported, CS2Team.T, "smg0")?.modelKey).toBe("mp5sd");
  expect(itemAt(imported, CS2Team.T, "melee")?.id).toBe(T_KNIFE_ID);
  expect(
    getLoadoutEntries(imported).some(({ item }) => item.type === "inventory")
  ).toBe(false);
});

test("every weapon that fits the grid has a price", () => {
  const modelKeys = CS2Economy.filterItems({
    isDefault: true,
    type: CS2ItemType.Weapon
  })
    .filter((item) =>
      ["secondary0", "secondary", "smg", "rifle"].includes(
        getItemGroup(item) ?? ""
      )
    )
    .map((item) => ensure(item.modelKey));
  expect(modelKeys.filter((key) => LOADOUT_PRICES[key] === undefined)).toEqual(
    []
  );
});
