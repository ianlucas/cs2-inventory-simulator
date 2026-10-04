/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2Economy,
  CS2Inventory,
  CS2InventoryItem,
  CS2ItemType,
  CS2_ITEMS,
  ensure
} from "@ianlucas/cs2-lib";
import { english } from "@ianlucas/cs2-lib/translations/english";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getItemIconKey, getViewerIconSlot } from "~/viewer-icon";
import { useViewerIcon } from "./use-viewer-icon";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

CS2Economy.load({
  items: CS2_ITEMS,
  language: english
});

const icons = vi.hoisted(() => ({
  listeners: new Map<string, Set<() => void>>(),
  requests: [] as string[],
  slots: [] as string[],
  urls: new Map<string, string>()
}));

vi.mock("~/viewer-icon.client", async () => {
  const { getItemIconKey } = await import("~/viewer-icon");
  return {
    viewerIcons: {
      getUrl: (slot: string) => icons.urls.get(slot),
      observe: () => () => {},
      pause: () => () => {},
      request: (item: CS2InventoryItem, slot: string) => {
        icons.requests.push(getItemIconKey(item));
        icons.slots.push(slot);
      },
      subscribe: (slot: string, listener: () => void) => {
        const entry = icons.listeners.get(slot) ?? new Set<() => void>();
        entry.add(listener);
        icons.listeners.set(slot, entry);
        return () => entry.delete(listener);
      }
    }
  };
});

vi.mock("~/components/app-context", () => ({
  usePreferences: () => ({ prefer2dStickerEditor: false }),
  useRules: () => ({
    viewer: { available: true, catalog: { holes: [], maxId: 1_000_000 } },
    viewerAttachmentsOnly: false,
    viewerKey: "key"
  })
}));

function ViewerIconProbe({
  enabled,
  foreign,
  item
}: {
  enabled: boolean;
  foreign?: boolean;
  item: CS2InventoryItem;
}) {
  const { url } = useViewerIcon(item, { enabled, foreign });
  return <div>{url ?? "none"}</div>;
}

describe("useViewerIcon", () => {
  let container: HTMLElement;
  let root: Root;
  let inventory: CS2Inventory;
  let item: CS2InventoryItem;

  beforeEach(() => {
    vi.useFakeTimers();
    icons.listeners.clear();
    icons.requests.length = 0;
    icons.slots.length = 0;
    icons.urls.clear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    inventory = new CS2Inventory({});
    inventory.add({ id: 244, seed: 1, wear: 0.1 });
    item = inventory.getAll()[0];
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  function render(enabled = true) {
    act(() => root.render(<ViewerIconProbe enabled={enabled} item={item} />));
  }

  function publish(url: string) {
    const slot = getViewerIconSlot(item);
    act(() => {
      icons.urls.set(slot, url);
      for (const listener of icons.listeners.get(slot) ?? []) {
        listener();
      }
    });
  }

  it("requests an icon for the item as it is first rendered", () => {
    render();

    expect(icons.requests).toEqual([getItemIconKey(item)]);
    expect(icons.slots).toEqual([getViewerIconSlot(item)]);
    expect(container.textContent).toBe("none");
  });

  it("shows the icon once there is one, and whichever replaces it", () => {
    render();
    publish("blob:before");
    expect(container.textContent).toBe("blob:before");

    publish("blob:after");
    expect(container.textContent).toBe("blob:after");
  });

  it("requests again when the item is edited in place", () => {
    render();
    const beforeEdit = getItemIconKey(item);

    vi.advanceTimersByTime(2000);
    inventory.edit(item.uid, { wear: 0.2 });
    render();

    expect(getItemIconKey(item)).not.toBe(beforeEdit);
    expect(icons.requests).toEqual([beforeEdit, getItemIconKey(item)]);
  });

  it("leaves a free item on its CDN image", () => {
    inventory.add({
      id: ensure(
        CS2_ITEMS.find(
          (item) => item.type === CS2ItemType.Weapon && item.isDefault === true
        )
      ).id
    });
    item = inventory.getAll()[1];
    render();

    expect(icons.requests).toEqual([]);
    expect(container.textContent).toBe("none");
  });

  it("slots someone else's item by its look, as its uid would clash with the user's", () => {
    act(() => root.render(<ViewerIconProbe enabled foreign item={item} />));

    expect(icons.requests).toEqual([getItemIconKey(item)]);
    expect(icons.slots).toEqual([getItemIconKey(item)]);
  });

  it("stays idle for a tile that does not want an icon", () => {
    render(false);
    publish("blob:x");

    expect(icons.requests).toEqual([]);
    expect(container.textContent).toBe("none");
  });
});
