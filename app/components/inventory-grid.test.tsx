/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { range } from "~/shared/number";
import {
  INVENTORY_GRID_ESTIMATED_ROW_HEIGHT,
  INVENTORY_GRID_OVERSCAN_ROWS,
  InventoryGrid
} from "./inventory-grid";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const GAP = 16;

// happy-dom doesn't lay anything out, so the grid's width and each row's
// height are what these stubs say.
function stubLayout({
  rowHeight = INVENTORY_GRID_ESTIMATED_ROW_HEIGHT,
  width = 1024
}: { rowHeight?: number; width?: number } = {}) {
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(width);
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(
    function (this: HTMLElement) {
      return this.dataset.index !== undefined ? rowHeight : 0;
    }
  );
}

function scrollTo(top: number) {
  act(() => {
    window.scrollTo({ top });
    window.dispatchEvent(new Event("scroll"));
  });
}

describe("InventoryGrid", () => {
  let container: HTMLElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    window.scrollTo({ top: 0 });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const renderGrid = (
    count: number,
    {
      columns,
      layoutKey = "test"
    }: { columns?: number; layoutKey?: string } = {}
  ) =>
    act(() => {
      root.render(
        <InventoryGrid
          columns={columns}
          getKey={(item) => item}
          items={range(count)}
          layoutKey={layoutKey}
        >
          {(item) => <div data-tile={item} />}
        </InventoryGrid>
      );
    });

  const tiles = () =>
    Array.from(container.querySelectorAll<HTMLElement>("[data-tile]"), (tile) =>
      Number(tile.dataset.tile)
    );

  const row = (index: number) =>
    container.querySelector(`[data-index="${index}"]`);

  test("mounts as many tiles for 5,000 items as for 1,000", () => {
    stubLayout();
    renderGrid(1_000);
    const mounted = tiles().length;
    renderGrid(5_000);

    const rowsOnScreen = Math.ceil(
      window.innerHeight / (INVENTORY_GRID_ESTIMATED_ROW_HEIGHT + GAP)
    );
    expect(mounted).toBeGreaterThan(0);
    expect(tiles()).toHaveLength(mounted);
    expect(mounted).toBeLessThanOrEqual(
      (rowsOnScreen + 1 + INVENTORY_GRID_OVERSCAN_ROWS * 2) * 6
    );
  });

  test("renders the rows the window scrolls to", () => {
    stubLayout();
    renderGrid(1_000);

    scrollTo(100 * (INVENTORY_GRID_ESTIMATED_ROW_HEIGHT + GAP));

    expect(tiles()).toContain(600);
    expect(tiles()).not.toContain(0);
  });

  test("fits as many columns as auto-fit would", () => {
    stubLayout({ width: 344 });
    renderGrid(10);

    expect(row(0)?.children).toHaveLength(2);
  });

  test("keeps a fixed column count however narrow it is", () => {
    stubLayout({ width: 344 });
    renderGrid(10, { columns: 6 });

    expect(row(0)?.children).toHaveLength(6);
    expect(row(1)?.children).toHaveLength(4);
  });

  test("remounts at the height it measured, so scroll restoration lands", () => {
    stubLayout({ rowHeight: 200 });
    vi.stubGlobal("innerHeight", 100 * (200 + GAP));
    renderGrid(1_000, { layoutKey: "remount" });
    const height = row(0)?.parentElement?.style.height;
    act(() => root.unmount());

    vi.stubGlobal("innerHeight", 768);
    root = createRoot(container);
    renderGrid(1_000, { layoutKey: "remount" });

    expect(row(50)).toBeNull();
    expect(row(0)?.parentElement?.style.height).toBe(height);
  });
});

describe("InventoryGrid on the server", () => {
  test("renders no tiles, only the grid's estimated height", () => {
    const html = renderToString(
      <InventoryGrid
        getKey={(item) => item}
        items={range(1_000)}
        layoutKey="ssr"
      >
        {(item) => <div data-tile={item} />}
      </InventoryGrid>
    );

    const rows = Math.ceil(1_000 / 6);
    expect(html).not.toContain("data-tile");
    expect(html).toContain(
      `height:${rows * INVENTORY_GRID_ESTIMATED_ROW_HEIGHT + (rows - 1) * GAP}px`
    );
  });
});
