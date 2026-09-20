/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2Economy,
  CS2Inventory,
  CS2InventoryItem,
  CS2_ITEMS
} from "@ianlucas/cs2-lib";
import { english } from "@ianlucas/cs2-lib/translations";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getItemIconKey } from "~/utils/item-icon";
import { useItemIcon } from "./use-item-icon";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

CS2Economy.load({
  items: CS2_ITEMS,
  language: english
});

const queue = vi.hoisted(() => ({
  listeners: new Map<string, Set<() => void>>(),
  requests: [] as { key: string; priority: boolean }[],
  unavailable: new Set<string>(),
  urls: new Map<string, string>()
}));

vi.mock("~/utils/item-icon-queue", () => ({
  getIconUrl: (key: string) => queue.urls.get(key),
  getIconUrlServer: () => undefined,
  isIconUnavailable: (key: string) => queue.unavailable.has(key),
  isIconUnavailableServer: () => false,
  observeIconTile: () => () => {},
  requestIcon: async (
    key: string,
    _item: unknown,
    options?: { priority?: boolean }
  ) => {
    queue.requests.push({ key, priority: options?.priority === true });
  },
  subscribeIcon: (key: string, listener: () => void) => {
    const entry = queue.listeners.get(key) ?? new Set<() => void>();
    entry.add(listener);
    queue.listeners.set(key, entry);
    return () => entry.delete(listener);
  }
}));

vi.mock("~/components/app-context", () => ({
  usePreferences: () => ({ prefer2dStickerEditor: false }),
  useRules: () => ({
    viewerAttachmentsOnly: false,
    viewerCatalog: { holes: [], maxId: 1_000_000 },
    viewerEnabled: true,
    viewerKey: "key",
    viewerOriginAllowed: true
  })
}));

function ItemIconProbe({ item }: { item: CS2InventoryItem }) {
  const { iconUrl } = useItemIcon(item, true);
  return <div>{iconUrl ?? "none"}</div>;
}

function publish(key: string, publishing: () => void) {
  act(() => {
    publishing();
    for (const listener of queue.listeners.get(key) ?? []) {
      listener();
    }
  });
}

describe("useItemIcon", () => {
  let container: HTMLElement;
  let root: Root;
  let inventory: CS2Inventory;
  let item: CS2InventoryItem;

  beforeEach(() => {
    vi.useFakeTimers();
    queue.listeners.clear();
    queue.requests.length = 0;
    queue.unavailable.clear();
    queue.urls.clear();
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

  function render() {
    act(() => root.render(<ItemIconProbe item={item} />));
  }

  function editItem() {
    vi.advanceTimersByTime(2000);
    inventory.edit(item.uid, { wear: 0.2 });
  }

  it("requests an icon for the item as it is first rendered", () => {
    render();

    expect(queue.requests).toEqual([
      { key: getItemIconKey(item), priority: false }
    ]);
  });

  it("requests a new icon when the item is edited in place", () => {
    render();
    const beforeEdit = getItemIconKey(item);

    editItem();
    render();

    expect(getItemIconKey(item)).not.toBe(beforeEdit);
    expect(queue.requests).toEqual([
      { key: beforeEdit, priority: false },
      { key: getItemIconKey(item), priority: true }
    ]);
  });

  it("keeps showing the icon it already has while the new one is generated", () => {
    render();
    publish(getItemIconKey(item), () =>
      queue.urls.set(getItemIconKey(item), "blob:before")
    );
    expect(container.textContent).toBe("blob:before");

    editItem();
    render();
    expect(container.textContent).toBe("blob:before");

    publish(getItemIconKey(item), () =>
      queue.urls.set(getItemIconKey(item), "blob:after")
    );
    expect(container.textContent).toBe("blob:after");
  });

  it("stops showing the stale icon once no new one is coming", () => {
    render();
    publish(getItemIconKey(item), () =>
      queue.urls.set(getItemIconKey(item), "blob:before")
    );

    editItem();
    render();
    expect(container.textContent).toBe("blob:before");

    publish(getItemIconKey(item), () =>
      queue.unavailable.add(getItemIconKey(item))
    );

    expect(container.textContent).toBe("none");
  });
});
