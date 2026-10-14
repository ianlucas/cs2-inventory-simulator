/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Team } from "@ianlucas/cs2-lib";
import { expect, test, vi } from "vitest";
import type { EquipOption } from "~/shared/inventory-equipped";
import { getEquipMenu } from "./inventory-item-equip-menu";

function option(value: Partial<EquipOption>): EquipOption {
  return { isEquipped: false, replaces: false, ...value };
}

function getLabels(options: EquipOption[]) {
  return getEquipMenu(options, {
    equip: () => {},
    unequip: () => {},
    viewInLoadout: () => {}
  }).map((group) => group.map(({ label }) => label));
}

test("inventory items keep the usual entries", () => {
  expect(
    getLabels([option({ team: CS2Team.T }), option({ team: CS2Team.CT })])
  ).toEqual([
    [
      "InventoryItemEquipT",
      "InventoryItemEquipCT",
      "InventoryItemEquipBothTeams"
    ],
    []
  ]);
  expect(
    getLabels([
      option({ isEquipped: true, team: CS2Team.T }),
      option({ team: CS2Team.CT })
    ])
  ).toEqual([["InventoryItemEquipCT"], ["InventoryItemUnequipT"]]);
});

test("slots in the loadout say whether a skin is replaced", () => {
  expect(
    getLabels([
      option({ replaces: true, slot: "rifle4", team: CS2Team.T }),
      option({ slot: "rifle4", team: CS2Team.CT })
    ])
  ).toEqual([
    [
      "InventoryItemReplaceTInLoadout",
      "InventoryItemEquipCTInLoadout",
      "InventoryItemReplaceBothTeamsInLoadout"
    ],
    []
  ]);
  expect(getLabels([option({ slot: "musickit" })])).toEqual([
    ["InventoryItemEquipInLoadout"],
    []
  ]);
});

test("both teams is left out when only one goes to the loadout", () => {
  expect(
    getLabels([
      option({ slot: "secondary3", team: CS2Team.T }),
      option({ team: CS2Team.CT })
    ])
  ).toEqual([["InventoryItemEquipTInLoadout", "InventoryItemEquipCT"], []]);
});

test("items equipped through the loadout link to it instead", () => {
  const viewInLoadout = vi.fn();
  const [, unequipMenu] = getEquipMenu(
    [
      option({ isEquipped: true, slot: "rifle4", team: CS2Team.T }),
      option({ isEquipped: true, team: CS2Team.CT })
    ],
    { equip: () => {}, unequip: () => {}, viewInLoadout }
  );
  expect(unequipMenu.map(({ label }) => label)).toEqual([
    "InventoryItemUnequipCT",
    "InventoryItemViewInLoadout"
  ]);
  unequipMenu[1].onClick();
  expect(viewInLoadout).toHaveBeenCalledWith(CS2Team.T);
});

test("the loadout opens on the CT side when both teams use the item", () => {
  const viewInLoadout = vi.fn();
  const [, unequipMenu] = getEquipMenu(
    [
      option({ isEquipped: true, slot: "rifle4", team: CS2Team.T }),
      option({ isEquipped: true, slot: "rifle4", team: CS2Team.CT })
    ],
    { equip: () => {}, unequip: () => {}, viewInLoadout }
  );
  expect(unequipMenu).toHaveLength(1);
  unequipMenu[0].onClick();
  expect(viewInLoadout).toHaveBeenCalledWith(CS2Team.CT);
});
