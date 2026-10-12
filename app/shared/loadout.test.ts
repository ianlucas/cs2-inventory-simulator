/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2_ITEMS,
  CS2Economy,
  CS2ItemType,
  CS2Team,
  ensure
} from "@ianlucas/cs2-lib";
import { english } from "@ianlucas/cs2-lib/translations/english";
import { expect, test } from "vitest";
import {
  canPlace,
  canRemoveSlot,
  canResetSlot,
  canResetSlotFinish,
  createDefaultLoadout,
  createSnapshot,
  getEconomyItem,
  getItemGroup,
  getLoadoutItem,
  getSideSlots,
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
const KARAMBIT_SKIN_ID = 1325;
const GRAFFITI_ID = 9543;
const COIN_ID = 8683;

function modelKeyAt(
  loadout: ReturnType<typeof createDefaultLoadout>,
  team: typeof CS2Team.CT | typeof CS2Team.T,
  slot: Parameters<typeof getLoadoutItem>[2]
) {
  const item = getLoadoutItem(loadout, team, slot);
  return item !== undefined ? getEconomyItem(item).modelKey : undefined;
}

test("createDefaultLoadout follows the game's factory slots", () => {
  const loadout = createDefaultLoadout();
  expect(modelKeyAt(loadout, CS2Team.CT, "secondary0")).toBe("hkp2000");
  expect(modelKeyAt(loadout, CS2Team.T, "secondary0")).toBe("glock");
  expect(modelKeyAt(loadout, CS2Team.CT, "smg4")).toBe("mp9");
  expect(modelKeyAt(loadout, CS2Team.T, "rifle1")).toBe("ak47");
  expect(modelKeyAt(loadout, CS2Team.T, "melee")).toBe("knife_t");
  expect(loadout.ct.c4).toBeUndefined();
  expect(loadout.t.c4).toBeDefined();
  expect(loadout.musicKit).toBeUndefined();
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

test("place puts a snapshot in the slot", () => {
  const result = place(createDefaultLoadout(), CS2Team.T, "smg0", {
    id: NOVA_SKIN_ID,
    equippedT: true,
    seed: 42,
    updatedAt: 1,
    wear: 0.1
  });
  expect(getLoadoutItem(ensure(result).loadout, CS2Team.T, "smg0")).toEqual({
    type: "snapshot",
    item: { id: NOVA_SKIN_ID, seed: 42, wear: 0.1 }
  });
});

test("place swaps a weapon already in another slot", () => {
  const result = place(createDefaultLoadout(), CS2Team.T, "smg3", {
    id: NOVA_SKIN_ID
  });
  expect(result?.swappedSlot).toBe("smg0");
  expect(
    getLoadoutItem(ensure(result).loadout, CS2Team.T, "smg3")?.item.id
  ).toBe(NOVA_SKIN_ID);
  expect(modelKeyAt(ensure(result).loadout, CS2Team.T, "smg0")).toBe("p90");
});

test("place replaces the finish of the same weapon in place", () => {
  const result = place(createDefaultLoadout(), CS2Team.CT, "smg0", {
    id: NOVA_SKIN_ID
  });
  expect(result?.swappedSlot).toBeUndefined();
  expect(
    getLoadoutItem(ensure(result).loadout, CS2Team.CT, "smg0")?.item.id
  ).toBe(NOVA_SKIN_ID);
});

test("place rejects items that do not fit", () => {
  const loadout = createDefaultLoadout();
  expect(place(loadout, CS2Team.CT, "rifle0", { id: AK47_ID })).toBe(undefined);
  expect(place(loadout, CS2Team.T, "secondary1", { id: GLOCK_ID })).toBe(
    undefined
  );
  expect(place(loadout, CS2Team.T, "melee", { id: NOVA_ID })).toBe(undefined);
});

test("place keeps the other team untouched", () => {
  const loadout = createDefaultLoadout();
  const result = place(loadout, CS2Team.T, "smg0", { id: NOVA_SKIN_ID });
  expect(result?.loadout.ct).toBe(loadout.ct);
});

test("resetSlot restores the factory weapon of a slot", () => {
  const swapped = ensure(
    place(createDefaultLoadout(), CS2Team.T, "smg3", {
      id: NOVA_SKIN_ID
    })
  ).loadout;
  expect(canResetSlot(swapped, CS2Team.T, "smg3")).toBe(true);
  const reset = ensure(resetSlot(swapped, CS2Team.T, "smg3")).loadout;
  expect(modelKeyAt(reset, CS2Team.T, "smg3")).toBe("p90");
  expect(getLoadoutItem(reset, CS2Team.T, "smg0")?.item.id).toBe(NOVA_SKIN_ID);
  expect(canResetSlot(reset, CS2Team.T, "smg3")).toBe(false);
});

test("resetSlotFinish keeps the weapon and drops its finish", () => {
  const loadout = ensure(
    place(createDefaultLoadout(), CS2Team.T, "smg0", {
      id: NOVA_SKIN_ID,
      wear: 0.1
    })
  ).loadout;
  expect(canResetSlotFinish(loadout, CS2Team.T, "smg0")).toBe(true);
  const reset = ensure(resetSlotFinish(loadout, CS2Team.T, "smg0")).loadout;
  expect(getLoadoutItem(reset, CS2Team.T, "smg0")).toEqual(
    createSnapshot({ id: NOVA_ID })
  );
  expect(canResetSlotFinish(reset, CS2Team.T, "smg0")).toBe(false);
});

test("resetSlot restores the team's default knife", () => {
  const loadout = ensure(
    place(createDefaultLoadout(), CS2Team.T, "melee", {
      id: KARAMBIT_SKIN_ID
    })
  ).loadout;
  expect(canResetSlot(loadout, CS2Team.T, "melee")).toBe(true);
  const reset = ensure(resetSlot(loadout, CS2Team.T, "melee")).loadout;
  expect(getLoadoutItem(reset, CS2Team.T, "melee")?.item.id).toBe(T_KNIFE_ID);
});

test("shared slots are the same for both teams and can be removed", () => {
  const loadout = ensure(
    place(createDefaultLoadout(), CS2Team.CT, "spray0", {
      id: GRAFFITI_ID,
      charges: 50
    })
  ).loadout;
  expect(getLoadoutItem(loadout, CS2Team.T, "spray0")?.item.id).toBe(
    GRAFFITI_ID
  );
  expect(canRemoveSlot(loadout, CS2Team.T, "spray0")).toBe(true);
  expect(canRemoveSlot(loadout, CS2Team.T, "melee")).toBe(false);
  expect(removeSlot(loadout, "spray0").graffiti).toBeUndefined();
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
