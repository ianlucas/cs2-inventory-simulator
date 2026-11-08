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
  useTranslate: () => (key: string) => key
}));

vi.mock("./hooks/use-viewer-availability", () => ({
  useOpensIn3d: () => false
}));

vi.mock("./item-image", () => ({ ItemImage: () => null }));

vi.mock("~/components/hooks/use-name-item", () => ({
  useNameItemString: () => () => ""
}));

vi.mock("~/components/hooks/use-sync", () => ({ useSync: () => vi.fn() }));

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
});
