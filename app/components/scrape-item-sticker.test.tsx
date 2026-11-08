/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, type CS2Inventory, ensure } from "@ianlucas/cs2-lib";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createInventory } from "~/shared/inventory";
import {
  findButton,
  holdButton,
  loadEconomy,
  PresenceHarness,
  setupTestRoot
} from "~/test-utils";
import { ScrapeItemSticker } from "./scrape-item-sticker";

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
  usePreferences: () => ({ statsForNerds: false }),
  useRules: () => ({ inventoryItemAllowRemoveSticker: true }),
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
    (item) =>
      item.isWeapon() &&
      item.isDefault === true &&
      item.getStickerSchemaCount() > 0
  )
);
const sticker = ensure(
  CS2Economy.itemsAsArray.find((item) => item.isSticker())
);

describe("ScrapeItemSticker", () => {
  const view = setupTestRoot();
  let uid: number;

  beforeEach(() => {
    vi.useFakeTimers();
    const inventory = createInventory().add({
      id: defaultWeapon.id,
      stickers: { 0: { id: sticker.id } }
    });
    uid = ensure(inventory.getAll()[0]).uid;
    inventoryStore.set(inventory);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("closes after removing the last sticker drops the item", () => {
    view.render(
      <PresenceHarness>
        {(onClose) => <ScrapeItemSticker onClose={onClose} uid={uid} />}
      </PresenceHarness>
    );
    act(() =>
      ensure(
        document.body.querySelector<HTMLButtonElement>("button.group")
      ).click()
    );
    holdButton(findButton("ScrapeStickerRemove"));
    expect(ensure(inventoryStore.get()).size()).toBe(0);
    expect(findButton("ScrapeStickerClose")).toBeDefined();
  });
});
