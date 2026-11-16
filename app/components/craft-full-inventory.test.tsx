/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, CS2Inventory, ensure } from "@ianlucas/cs2-lib";
import { useEffect } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { findButton, loadEconomy, setupTestRoot } from "~/test-utils";
import { CraftNew } from "./craft-new";
import { CraftView } from "./craft-view";

loadEconomy();

const rules = {
  craftHideCategory: [] as string[],
  craftHideFilterType: [] as string[],
  craftHideId: [] as number[],
  craftHideModel: [] as string[],
  craftHideType: [] as string[],
  craftMaxQuantity: 0,
  inventoryMaxItems: 1
};

let inventory = new CS2Inventory({ maxItems: rules.inventoryMaxItems });

vi.mock("./app-context", () => ({
  useInventory: () => [inventory, vi.fn()],
  useRules: () => rules,
  useTranslate: () => (key: string) => key
}));

vi.mock("./item-editor", () => ({
  ItemEditor: ({ onChange }: { onChange: (attributes: object) => void }) => {
    useEffect(() => onChange({ quantity: 1 }), [onChange]);
    return null;
  }
}));

const item = ensure(CS2Economy.itemsAsArray.find((item) => item.isWeapon()));

describe.each([
  { name: "CraftNew", Component: CraftNew },
  { name: "CraftView", Component: CraftView }
])("$name", ({ Component }) => {
  const view = setupTestRoot();

  beforeEach(() => {
    inventory = new CS2Inventory({ maxItems: rules.inventoryMaxItems });
  });

  function render() {
    view.render(<Component item={item} onClose={vi.fn()} onSubmit={vi.fn()} />);
  }

  test("enables the craft button when the inventory has room", () => {
    render();
    expect(ensure(findButton("EditorCraft")).disabled).toBe(false);
  });

  test("disables the craft button when the inventory is full", () => {
    inventory.add({ id: item.id });
    render();
    expect(ensure(findButton("EditorCraft")).disabled).toBe(true);
  });
});
