/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, type CS2Inventory, ensure } from "@ianlucas/cs2-lib";
import { act, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createInventory } from "~/shared/inventory";
import {
  findButton,
  loadEconomy,
  PresenceHarness,
  setupTestRoot
} from "~/test-utils";
import { ApplyItemSticker } from "./apply-item-sticker";

loadEconomy();

const stores = await vi.hoisted(async () => {
  const { createTestStore } = await import("~/test-utils");
  return {
    available: createTestStore(false),
    inventory: createTestStore<CS2Inventory | undefined>(undefined)
  };
});

const viewer = vi.hoisted(() => {
  const handlers = new Map<string, (data: unknown) => void>();
  return {
    api: {
      highlightSticker: () => {},
      on(event: string, handler: (data: unknown) => void) {
        handlers.set(event, handler);
        return () => handlers.delete(event);
      },
      setActiveSticker: () => {},
      whenReady: () => Promise.resolve()
    },
    fail: () =>
      handlers.get("rateLimited")?.({ retryAfterMs: 1000, scope: "origin" })
  };
});

vi.mock("./app-context", () => ({
  useInventory: () => [
    stores.inventory.use(),
    (next: CS2Inventory) => stores.inventory.set(next.move())
  ],
  useInventoryItems: () => [],
  usePreferences: () => ({ prefer2dStickerEditor: false }),
  useRules: () => ({ viewer: {} }),
  useTranslate: () => (key: string) => key
}));

vi.mock("~/viewer-client-availability", () => ({
  viewerClientAvailability: {
    getSnapshot: stores.available.get,
    isAvailable: stores.available.get,
    isIdSupported: () => true,
    isItemSupported: () => true,
    reportRateLimited: vi.fn(),
    reportTimeout: vi.fn(),
    reportUnsupported: vi.fn(),
    subscribe: stores.available.subscribe
  }
}));

vi.mock("./hooks/use-viewer", () => ({
  useViewer: () => ({ api: viewer.api, viewerProps: {} })
}));

vi.mock("./viewer-overlay", () => ({
  ViewerOverlay: ({
    children,
    header
  }: {
    children: ReactNode;
    header: ReactNode;
  }) => (
    <>
      {header}
      {children}
    </>
  )
}));

vi.mock("./item-image", () => ({ ItemImage: () => null }));

vi.mock("~/components/hooks/use-name-item", () => ({
  useNameItemString: () => () => ""
}));

vi.mock("~/components/hooks/use-sync", () => ({ useSync: () => vi.fn() }));

vi.mock("~/sound.client", () => ({ initSounds: vi.fn(), playSound: vi.fn() }));

const targetItem = ensure(
  CS2Economy.itemsAsArray.find(
    (item) => item.isWeapon() && item.getStickerSchemaCount() > 0
  )
);
const stickerItem = ensure(
  CS2Economy.itemsAsArray.find((item) => item.isSticker())
);

function click(button: HTMLButtonElement | null | undefined) {
  act(() => ensure(button).click());
}

describe("ApplyItemSticker", () => {
  const view = setupTestRoot();
  let stickerUid: number;
  let targetUid: number;

  beforeEach(() => {
    const inventory = createInventory()
      .add({ id: targetItem.id })
      .add({ id: stickerItem.id });
    const items = inventory.getAll();
    targetUid = ensure(items.find(({ id }) => id === targetItem.id)).uid;
    stickerUid = ensure(items.find(({ id }) => id === stickerItem.id)).uid;
    stores.available.set(false);
    stores.inventory.set(inventory);
  });

  function render() {
    view.render(
      <PresenceHarness>
        {(onClose) => (
          <ApplyItemSticker
            onClose={onClose}
            stickerUid={stickerUid}
            targetUid={targetUid}
          />
        )}
      </PresenceHarness>
    );
  }

  function isStickerConsumed() {
    return !ensure(stores.inventory.get())
      .getAll()
      .some(({ uid }) => uid === stickerUid);
  }

  function isShowing3d() {
    return findButton("ApplyStickerConfirmPosition") !== undefined;
  }

  describe("in 2D", () => {
    function pickFirstSlot() {
      click(document.body.querySelector<HTMLButtonElement>("button.group"));
    }

    test("stays in 2D when 3D becomes available mid-use", () => {
      render();
      pickFirstSlot();
      act(() => stores.available.set(true));
      expect(findButton("ApplyStickerUse")?.disabled).toBe(false);
    });

    test("stays in 2D when 3D becomes available while closing", () => {
      render();
      pickFirstSlot();
      click(findButton("ApplyStickerUse"));
      expect(isStickerConsumed()).toBe(true);
      act(() => stores.available.set(true));
      expect(findButton("ApplyStickerUse")).toBeDefined();
    });
  });

  describe("in 3D", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      stores.available.set(true);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    async function renderReady() {
      render();
      await act(async () => {});
      act(() => vi.runOnlyPendingTimers());
      click(findButton("ApplyStickerConfirmPosition"));
    }

    test("falls back to 2D when the viewer fails mid-use", async () => {
      await renderReady();
      act(() => viewer.fail());
      expect(isShowing3d()).toBe(false);
      expect(document.body.querySelector("button.group")).not.toBeNull();
    });

    test("stays in 3D when the viewer fails while closing", async () => {
      await renderReady();
      click(findButton("ApplyStickerUse"));
      expect(isStickerConsumed()).toBe(true);
      act(() => viewer.fail());
      expect(isShowing3d()).toBe(true);
    });

    test("stays in 3D when the viewer fails in the same update as the close", async () => {
      await renderReady();
      act(() => {
        ensure(findButton("ApplyStickerUse")).click();
        viewer.fail();
      });
      expect(isStickerConsumed()).toBe(true);
      expect(isShowing3d()).toBe(true);
    });
  });
});
