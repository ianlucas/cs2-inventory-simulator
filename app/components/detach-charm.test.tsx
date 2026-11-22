/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, type CS2Inventory, ensure } from "@ianlucas/cs2-lib";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createInventory } from "~/shared/inventory";
import {
  findButton,
  holdButton,
  loadEconomy,
  PresenceHarness,
  setupTestRoot
} from "~/test-utils";
import { DetachCharm } from "./detach-charm";

loadEconomy();

const inventoryStore = await vi.hoisted(async () => {
  const { createTestStore } = await import("~/test-utils");
  return createTestStore<CS2Inventory | undefined>(undefined);
});

vi.mock("./app-context", () => ({
  useInventory: () => [
    inventoryStore.use(),
    (next: CS2Inventory) => inventoryStore.set(next.move())
  ],
  useInventoryItems: () => [],
  useRules: () => ({
    craftHideCategory: [],
    craftHideFilterType: [],
    craftHideId: [],
    craftHideModel: [],
    craftHideType: [],
    craftMaxQuantity: 0,
    inventoryMaxItems: 2
  }),
  useTranslate: () => (key: string) => key
}));

vi.mock("./hooks/use-viewer-availability", () => ({
  useOpensIn3d: () => false
}));

vi.mock("./item-image", () => ({ ItemImage: () => null }));

vi.mock("~/components/hooks/use-name-item", () => ({
  useNameItemString: () => () => ""
}));

const sync = vi.hoisted(() => vi.fn());

vi.mock("~/components/hooks/use-sync", () => ({ useSync: () => sync }));

vi.mock("~/sound.client", () => ({ initSounds: vi.fn(), playSound: vi.fn() }));

const defaultWeapon = ensure(
  CS2Economy.itemsAsArray.find(
    (item) => item.isWeapon() && item.isDefault === true && item.hasKeychains()
  )
);
const charm = ensure(CS2Economy.itemsAsArray.find((item) => item.isKeychain()));

describe("DetachCharm", () => {
  const view = setupTestRoot();
  let uid: number;

  beforeEach(() => {
    vi.useFakeTimers();
    sync.mockClear();
    const inventory = createInventory()
      .add({ id: defaultWeapon.id, keychains: { 0: { id: charm.id } } })
      .add({ id: CS2Economy.getCharmDetachment().id })
      .add({ id: CS2Economy.getCharmDetachment().id });
    uid = ensure(
      inventory.getAll().find(({ id }) => id === defaultWeapon.id)
    ).uid;
    inventoryStore.set(inventory);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("closes after detaching the only charm drops the item", () => {
    view.render(
      <PresenceHarness>
        {(onClose) => <DetachCharm onClose={onClose} uid={uid} />}
      </PresenceHarness>
    );
    holdButton(findButton("DetachCharmConfirm"));
    expect(
      ensure(inventoryStore.get())
        .getAll()
        .some((item) => item.uid === uid && item.id === defaultWeapon.id)
    ).toBe(false);
    expect(findButton("DetachCharmClose")).toBeDefined();
  });

  function setupFullInventory(charges: number) {
    const inventory = createInventory({ maxItems: 2 }).add({
      id: defaultWeapon.id,
      keychains: { 0: { id: charm.id } }
    });
    for (let i = 0; i < charges; i++) {
      inventory.add({ id: CS2Economy.getCharmDetachment().id });
    }
    expect(inventory.isFull()).toBe(true);
    uid = ensure(
      inventory.getAll().find(({ id }) => id === defaultWeapon.id)
    ).uid;
    inventoryStore.set(inventory);
  }

  function renderDetachCharm() {
    view.render(
      <PresenceHarness>
        {(onClose) => <DetachCharm onClose={onClose} uid={uid} />}
      </PresenceHarness>
    );
  }

  test("blocks detaching when the inventory is full and charges remain", () => {
    setupFullInventory(2);
    renderDetachCharm();
    const button = ensure(findButton("DetachCharmConfirm"));
    expect(button.disabled).toBe(true);
    expect(document.body.textContent).toContain("HeaderCraftInventoryFull");
    holdButton(button);
    const inventory = ensure(inventoryStore.get());
    expect(inventory.get(uid).getKeychainsCount()).toBe(1);
    expect(inventory.getCharmDetachmentCharges()).toBe(2);
    expect(sync).not.toHaveBeenCalled();
  });

  test("allows detaching when the inventory is full and one charge remains", () => {
    setupFullInventory(1);
    renderDetachCharm();
    const button = ensure(findButton("DetachCharmConfirm"));
    expect(button.disabled).toBe(false);
    holdButton(button);
    const inventory = ensure(inventoryStore.get());
    expect(inventory.getCharmDetachmentCharges()).toBe(0);
    expect(inventory.getAll().some(({ id }) => id === charm.id)).toBe(true);
    expect(sync).toHaveBeenCalledTimes(1);
  });
});
