/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, CS2Inventory, ensure } from "@ianlucas/cs2-lib";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { loadEconomy, setupTestRoot } from "~/test-utils";
import { DetachCharmAddPack } from "./detach-charm";
import { SealItemStickerAddSlab } from "./seal-item-sticker";
import { UnlockCaseContainerAddKey } from "./unlock-case-container-add-key";

loadEconomy();

function createRules() {
  return {
    craftHideCategory: [] as string[],
    craftHideFilterType: [] as string[],
    craftHideId: [] as number[],
    craftHideModel: [] as string[],
    craftHideType: [] as string[],
    craftMaxQuantity: 0,
    inventoryMaxItems: 100
  };
}

let rules = createRules();

const inventory = new CS2Inventory();

vi.mock("./app-context", () => ({
  useInventory: () => [inventory, vi.fn()],
  useRules: () => rules,
  useTranslate: () => (key: string) => key
}));

vi.mock("./hooks/use-sync", () => ({
  useSync: () => vi.fn()
}));

const keyItem = ensure(CS2Economy.itemsAsArray.find((item) => item.isKey()));
const packItem = ensure(
  CS2Economy.itemsAsArray.find((item) => item.isCharmDetachmentPack())
);
const slabToolItem = ensure(
  CS2Economy.itemsAsArray.find((item) => item.isStickerSlab())
);

const shortcuts = [
  {
    name: "UnlockCaseContainerAddKey",
    item: keyItem,
    element: <UnlockCaseContainerAddKey caseUid={0} neededKeyItem={keyItem} />
  },
  {
    name: "DetachCharmAddPack",
    item: packItem,
    element: <DetachCharmAddPack onAdd={vi.fn()} packItem={packItem} />
  },
  {
    name: "SealItemStickerAddSlab",
    item: slabToolItem,
    element: (
      <SealItemStickerAddSlab onAdd={vi.fn()} slabToolItem={slabToolItem} />
    )
  }
];

describe.each(shortcuts)("$name", ({ element, item }) => {
  const view = setupTestRoot();

  beforeEach(() => {
    rules = createRules();
  });

  function render() {
    view.render(element);
  }

  test("shows the add button when no rule hides its item", () => {
    render();
    expect(view.container.textContent).toContain("CaseAdd");
  });

  test("is hidden when craftHideType contains its item type", () => {
    rules.craftHideType = [item.type];
    render();
    expect(view.container.innerHTML).toBe("");
  });

  test("is hidden when craftHideFilterType contains its item type", () => {
    rules.craftHideFilterType = [item.type];
    render();
    expect(view.container.innerHTML).toBe("");
  });

  test("is hidden when craftHideId contains its item id", () => {
    rules.craftHideId = [item.id];
    render();
    expect(view.container.innerHTML).toBe("");
  });
});
