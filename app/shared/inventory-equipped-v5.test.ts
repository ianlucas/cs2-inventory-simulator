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
  ensure
} from "@ianlucas/cs2-lib";
import { english } from "@ianlucas/cs2-lib/translations/english";
import { expect, test } from "vitest";
import { generate } from "./inventory-equipped-v5";

CS2Economy.load({
  items: CS2_ITEMS,
  language: english
});

const pets = CS2_ITEMS.filter((item) => item.type === CS2ItemType.Pet);
const egg = ensure(
  pets.find((item) => item.variantIndex === CS2_PET_EGG_VARIANT_INDEX)
);
const [catalana, silkie] = pets.filter((item) => item.styleCount !== undefined);

function equipNew(inventory: CS2Inventory, item: CS2BaseInventoryItem) {
  inventory.add(item);
  const uid = Math.max(...inventory.getAll().map(({ uid }) => uid));
  inventory.equip(uid);
  return uid;
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
