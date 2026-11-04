/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ItemSelectorProvider, useItemSelector } from "./item-selector-context";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const context = vi.hoisted(() => ({
  itemSelector: undefined as ReturnType<typeof useItemSelector>[0],
  setItemSelector: undefined as
    ReturnType<typeof useItemSelector>[1] | undefined,
  sync: new EventTarget()
}));

vi.mock("~/sync", () => ({
  sync: context.sync
}));

function Probe() {
  [context.itemSelector, context.setItemSelector] = useItemSelector();
  return null;
}

describe("ItemSelectorProvider", () => {
  let container: HTMLElement;
  let root: Root;

  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root.render(
        <ItemSelectorProvider>
          <Probe />
        </ItemSelectorProvider>
      );
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    context.itemSelector = undefined;
    context.setItemSelector = undefined;
    vi.restoreAllMocks();
  });

  test("closes the item selector on sync error", () => {
    act(() => {
      context.setItemSelector?.({
        items: [],
        type: "deposit-to-storage-unit",
        uid: 1
      });
    });
    expect(context.itemSelector?.uid).toBe(1);

    act(() => {
      context.sync.dispatchEvent(new Event("syncerror"));
    });
    expect(context.itemSelector).toBeUndefined();
  });
});
