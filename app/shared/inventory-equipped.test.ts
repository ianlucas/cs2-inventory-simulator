/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2_ITEMS,
  CS2BaseInventoryItem,
  CS2Economy,
  CS2Inventory,
  CS2ItemType,
  CS2Team,
  ensure
} from "@ianlucas/cs2-lib";
import { english } from "@ianlucas/cs2-lib/translations/english";
import { expect, test } from "vitest";
import { createEquippedInventory } from "./inventory-equipped";
import {
  Loadout,
  LoadoutSlot,
  LoadoutTeam,
  createDefaultLoadout,
  place
} from "./loadout";

CS2Economy.load({
  items: CS2_ITEMS,
  language: english
});

const catalana = ensure(
  CS2_ITEMS.find(
    (item) => item.type === CS2ItemType.Pet && item.styleCount !== undefined
  )
);

const AWP_SKIN_ID = 296;
const AWP_OTHER_SKIN_ID = 297;
const AK47_SKIN_ID = 214;
const M4A4_SKIN_ID = 450;
const CZ75_SKIN_ID = 1158;
const KARAMBIT_SKIN_ID = 1325;
const MUSIC_KIT_ID = 1780;
const STICKER_ID = 1847;

function addNew(inventory: CS2Inventory, item: CS2BaseInventoryItem) {
  inventory.add(item);
  return Math.max(...inventory.getAll().map(({ uid }) => uid));
}

function equipNew(
  inventory: CS2Inventory,
  item: CS2BaseInventoryItem,
  team?: LoadoutTeam
) {
  const uid = addNew(inventory, item);
  inventory.equip(uid, team);
  return uid;
}

function placed(
  inventory: CS2Inventory,
  team: LoadoutTeam,
  slot: LoadoutSlot,
  uid: number,
  loadout: Loadout = createDefaultLoadout()
) {
  return ensure(
    place(loadout, inventory, team, slot, { type: "inventory", uid })
  ).loadout;
}

test("without a loadout, the inventory's equipped items are used", () => {
  const inventory = new CS2Inventory();
  const awp = equipNew(inventory, { id: AWP_SKIN_ID }, CS2Team.T);
  const musicKit = equipNew(inventory, { id: MUSIC_KIT_ID });
  const equipped = createEquippedInventory(inventory);
  expect(equipped.getFlags(awp)).toEqual({ equippedT: true });
  expect(equipped.getFlags(musicKit)).toEqual({ equipped: true });
});

test("items hidden from equipping are never equipped", () => {
  const inventory = new CS2Inventory();
  const awp = addNew(inventory, { id: AWP_SKIN_ID });
  inventory.equip(awp, CS2Team.T);
  const hidden = { models: ["awp"], types: [] };
  expect(
    createEquippedInventory(inventory, undefined, hidden).getFlags(awp)
  ).toEqual({});
  expect(
    createEquippedInventory(
      inventory,
      placed(inventory, CS2Team.CT, "rifle4", awp),
      hidden
    ).getFlags(awp)
  ).toEqual({});
});

test("the loadout's item replaces the one equipped in the inventory", () => {
  const inventory = new CS2Inventory();
  const dragonLore = equipNew(inventory, { id: AWP_SKIN_ID }, CS2Team.T);
  const asiimov = addNew(inventory, { id: AWP_OTHER_SKIN_ID });
  const equipped = createEquippedInventory(
    inventory,
    placed(inventory, CS2Team.T, "rifle4", asiimov)
  );
  expect(equipped.getFlags(dragonLore)).toEqual({});
  expect(equipped.getFlags(asiimov)).toEqual({ equippedT: true });
});

test("a stock item in the loadout leaves nothing equipped", () => {
  const inventory = new CS2Inventory();
  const ak47 = equipNew(inventory, { id: AK47_SKIN_ID }, CS2Team.T);
  const karambit = equipNew(inventory, { id: KARAMBIT_SKIN_ID }, CS2Team.CT);
  const equipped = createEquippedInventory(inventory, createDefaultLoadout());
  expect(equipped.getFlags(ak47)).toEqual({});
  expect(equipped.getFlags(karambit)).toEqual({});
});

test("weapons and pets outside the loadout keep their equipped items", () => {
  const inventory = new CS2Inventory();
  const m4a4 = equipNew(inventory, { id: M4A4_SKIN_ID }, CS2Team.CT);
  const pet = equipNew(inventory, { id: catalana.id });
  const equipped = createEquippedInventory(inventory, createDefaultLoadout());
  expect(equipped.getFlags(m4a4)).toEqual({ equippedCT: true });
  expect(equipped.getFlags(pet)).toEqual({ equipped: true });
});

test("an empty shared slot in the loadout means nothing equipped", () => {
  const inventory = new CS2Inventory();
  const musicKit = equipNew(inventory, { id: MUSIC_KIT_ID });
  expect(
    createEquippedInventory(inventory, createDefaultLoadout()).getFlags(
      musicKit
    )
  ).toEqual({});
  expect(
    createEquippedInventory(
      inventory,
      placed(inventory, CS2Team.CT, "musickit", musicKit)
    ).getFlags(musicKit)
  ).toEqual({ equipped: true });
});

test("an item in the loadout for both teams is equipped for both", () => {
  const inventory = new CS2Inventory();
  const awp = addNew(inventory, { id: AWP_SKIN_ID });
  const loadout = placed(
    inventory,
    CS2Team.CT,
    "rifle4",
    awp,
    placed(inventory, CS2Team.T, "rifle4", awp)
  );
  expect(createEquippedInventory(inventory, loadout).getFlags(awp)).toEqual({
    equippedCT: true,
    equippedT: true
  });
});

test("options go to the loadout only for the slots it fills", () => {
  const inventory = new CS2Inventory();
  const cz75 = addNew(inventory, { id: CZ75_SKIN_ID });
  const loadout = placed(inventory, CS2Team.T, "secondary3", cz75);
  const other = addNew(inventory, { id: CZ75_SKIN_ID });
  const equipped = createEquippedInventory(inventory, loadout);
  expect(equipped.getEquipOptions(inventory.get(other))).toEqual([
    {
      isEquipped: false,
      replaces: true,
      slot: "secondary3",
      team: CS2Team.T
    },
    {
      isEquipped: false,
      replaces: false,
      slot: undefined,
      team: CS2Team.CT
    }
  ]);
  expect(equipped.getEquipOption(inventory.get(cz75), CS2Team.T)).toEqual({
    isEquipped: true,
    replaces: true,
    slot: "secondary3",
    team: CS2Team.T
  });
});

test("a stock item in the slot is not replaced", () => {
  const inventory = new CS2Inventory();
  const awp = addNew(inventory, { id: AWP_SKIN_ID });
  const equipped = createEquippedInventory(inventory, createDefaultLoadout());
  expect(equipped.getEquipOption(inventory.get(awp), CS2Team.CT)).toEqual({
    isEquipped: false,
    replaces: false,
    slot: "rifle4",
    team: CS2Team.CT
  });
});

test("items without a team have one option, others none", () => {
  const inventory = new CS2Inventory();
  const musicKit = addNew(inventory, { id: MUSIC_KIT_ID });
  const sticker = addNew(inventory, { id: STICKER_ID });
  const equipped = createEquippedInventory(inventory, createDefaultLoadout());
  expect(equipped.getEquipOptions(inventory.get(musicKit))).toEqual([
    { isEquipped: false, replaces: false, slot: "musickit", team: undefined }
  ]);
  expect(equipped.getEquipOptions(inventory.get(sticker))).toEqual([]);
});
