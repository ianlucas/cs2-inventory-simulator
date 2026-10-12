/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2_ITEMS,
  CS2_MIN_PET_SEED,
  CS2_PET_EGG_UPGRADE_LEVEL,
  CS2_PET_EGG_VARIANT_INDEX,
  CS2_PET_HEN_UPGRADE_LEVEL,
  CS2_PET_PULLET_UPGRADE_LEVEL,
  CS2BaseInventoryItem,
  CS2Economy,
  CS2Inventory,
  CS2ItemType,
  CS2Team,
  ensure
} from "@ianlucas/cs2-lib";
import { english } from "@ianlucas/cs2-lib/translations/english";
import { expect, test } from "vitest";
import { generate } from "./inventory-equipped-v5";
import {
  Loadout,
  LoadoutSlot,
  LoadoutTeam,
  createDefaultLoadout,
  createSnapshot,
  place
} from "./loadout";

CS2Economy.load({
  items: CS2_ITEMS,
  language: english
});

const pets = CS2_ITEMS.filter((item) => item.type === CS2ItemType.Pet);
const egg = ensure(
  pets.find((item) => item.variantIndex === CS2_PET_EGG_VARIANT_INDEX)
);
const [catalana, silkie] = pets.filter((item) => item.styleCount !== undefined);

const AK47_SKIN_ID = 214;
const AK47_OTHER_SKIN_ID = 215;
const M4A4_SKIN_ID = 450;
const USP_ID = 32;
const KARAMBIT_SKIN_ID = 1325;
const MUSIC_KIT_ID = 1780;
const CT_AGENT_ID = 8629;

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

test("an equipped pet carries what the game plugin reads", async () => {
  const inventory = new CS2Inventory();
  const uid = equipNew(inventory, {
    id: catalana.id,
    nameTag: "Nugget",
    seed: 1234,
    style: 5,
    upgradeLevel: CS2_PET_PULLET_UPGRADE_LEVEL
  });
  const { pet } = await generate(inventory);
  expect(pet).toEqual({
    def: catalana.definitionIndex,
    hash: expect.any(String),
    nametag: "Nugget",
    petId: catalana.variantIndex,
    seed: 1234,
    style: 5,
    uid,
    upgradeLevel: CS2_PET_PULLET_UPGRADE_LEVEL
  });
});

test("a pet without attributes resolves to its defaults", async () => {
  const inventory = new CS2Inventory();
  equipNew(inventory, { id: catalana.id });
  const { pet } = await generate(inventory);
  expect(pet?.nametag).toBe("");
  expect(pet?.seed).toBe(CS2_MIN_PET_SEED);
  expect(pet?.style).toBeUndefined();
  expect(pet?.upgradeLevel).toBe(CS2_PET_HEN_UPGRADE_LEVEL);
});

// The plugin deploys a pet whose level is unset, so an egg must always say it is one.
test("an egg always carries its level", async () => {
  const inventory = new CS2Inventory();
  equipNew(inventory, { id: egg.id });
  const { pet } = await generate(inventory);
  expect(pet?.upgradeLevel).toBe(CS2_PET_EGG_UPGRADE_LEVEL);
});

test("equipping a second pet replaces the first", async () => {
  const inventory = new CS2Inventory();
  equipNew(inventory, { id: catalana.id });
  const uid = equipNew(inventory, { id: silkie.id });
  const { pet } = await generate(inventory);
  expect(pet?.uid).toBe(uid);
  expect(pet?.petId).toBe(silkie.variantIndex);
});

test("a pet type hidden from equipping is left out", async () => {
  const inventory = new CS2Inventory();
  equipNew(inventory, { id: catalana.id });
  const { pet } = await generate(inventory, {
    models: [],
    types: [CS2ItemType.Pet]
  });
  expect(pet).toBeUndefined();
});

test("no pet is sent when none is equipped", async () => {
  const inventory = new CS2Inventory();
  inventory.add({ id: catalana.id });
  const { pet } = await generate(inventory);
  expect(pet).toBeUndefined();
});

test("no loadout is sent when none is active", async () => {
  const { loadout } = await generate(new CS2Inventory());
  expect(loadout).toBeUndefined();
});

test("the loadout maps every weapon slot to its item", async () => {
  const inventory = new CS2Inventory();
  const loadout = ensure(
    place(
      createDefaultLoadout(),
      inventory,
      CS2Team.CT,
      "secondary0",
      createSnapshot(USP_ID)
    )
  ).loadout;
  const { loadout: slots } = await generate(inventory, undefined, loadout);
  expect(Object.keys(ensure(slots)[CS2Team.CT])).toHaveLength(15);
  expect(ensure(slots)[CS2Team.CT][2]).toBe(61);
  expect(ensure(slots)[CS2Team.CT][12]).toBe(34);
  expect(ensure(slots)[CS2Team.T][2]).toBe(4);
  expect(ensure(slots)[CS2Team.T][15]).toBe(7);
});

test("a loadout item replaces the equipped one", async () => {
  const inventory = new CS2Inventory();
  equipNew(inventory, { id: AK47_SKIN_ID }, CS2Team.T);
  const uid = addNew(inventory, { id: AK47_OTHER_SKIN_ID });
  const { tWeapons } = await generate(
    inventory,
    undefined,
    placed(inventory, CS2Team.T, "rifle1", uid)
  );
  expect(tWeapons[7].uid).toBe(uid);
});

test("a stock item in the loadout drops the equipped one", async () => {
  const inventory = new CS2Inventory();
  equipNew(inventory, { id: AK47_SKIN_ID }, CS2Team.T);
  equipNew(inventory, { id: KARAMBIT_SKIN_ID }, CS2Team.CT);
  equipNew(inventory, { id: CT_AGENT_ID }, CS2Team.CT);
  const { agents, knives, tWeapons } = await generate(
    inventory,
    undefined,
    createDefaultLoadout()
  );
  expect(tWeapons[7]).toBeUndefined();
  expect(knives[CS2Team.CT]).toBeUndefined();
  expect(agents[CS2Team.CT]).toBeUndefined();
});

test("weapons outside the loadout keep their equipped skin", async () => {
  const inventory = new CS2Inventory();
  equipNew(inventory, { id: M4A4_SKIN_ID }, CS2Team.CT);
  const { ctWeapons } = await generate(
    inventory,
    undefined,
    createDefaultLoadout()
  );
  expect(ctWeapons[16]).toBeDefined();
});

test("an empty music kit slot means no music kit, but the pet stays", async () => {
  const inventory = new CS2Inventory();
  const uid = equipNew(inventory, { id: MUSIC_KIT_ID });
  equipNew(inventory, { id: catalana.id });
  const { musicKit, pet } = await generate(
    inventory,
    undefined,
    createDefaultLoadout()
  );
  expect(musicKit).toBeUndefined();
  expect(pet).toBeDefined();
  const { musicKit: placedMusicKit } = await generate(
    inventory,
    undefined,
    placed(inventory, CS2Team.CT, "musickit", uid)
  );
  expect(placedMusicKit?.uid).toBe(uid);
});

test("a hidden loadout item sends no skin but keeps its slot", async () => {
  const inventory = new CS2Inventory();
  const uid = addNew(inventory, { id: AK47_SKIN_ID });
  const { loadout, tWeapons } = await generate(
    inventory,
    { models: ["ak47"], types: [] },
    placed(inventory, CS2Team.T, "rifle1", uid)
  );
  expect(tWeapons[7]).toBeUndefined();
  expect(ensure(loadout)[CS2Team.T][15]).toBe(7);
});
