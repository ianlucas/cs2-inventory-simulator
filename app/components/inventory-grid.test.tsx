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
  INVENTORY_GRID_DEFAULT_COLUMNS,
  INVENTORY_GRID_ESTIMATED_ROW_HEIGHT,
  INVENTORY_GRID_GAP,
  INVENTORY_GRID_OVERSCAN_ROWS,
  InventoryGrid
} from "./inventory-grid";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function getItems(count: number, firstUid = 0) {
  return range(count, firstUid).map((uid) => ({ uid }));
}

let gridTop = 0;

function stubLayout({
  rowHeight = INVENTORY_GRID_ESTIMATED_ROW_HEIGHT,
  width = 1024
}: { rowHeight?: number; width?: number } = {}) {
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(width);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    () => new DOMRect(0, gridTop - window.scrollY, width, 0)
  );
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
    gridTop = 0;
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
      firstUid,
      fixedColumns,
      layoutKey = "test"
    }: { firstUid?: number; fixedColumns?: number; layoutKey?: string } = {}
  ) =>
    act(() => {
      root.render(
        <InventoryGrid
          fixedColumns={fixedColumns}
          items={getItems(count, firstUid)}
          layoutKey={layoutKey}
        >
          {({ uid }) => <div data-tile={uid} />}
        </InventoryGrid>
      );
    });

  const remount = () => {
    act(() => root.unmount());
    root = createRoot(container);
  };

  const tiles = () =>
    Array.from(container.querySelectorAll<HTMLElement>("[data-tile]"), (tile) =>
      Number(tile.dataset.tile)
    );

  const row = (index: number) =>
    container.querySelector(`[data-index="${index}"]`);

  const height = () => row(0)?.parentElement?.style.height;

  test("mounts as many tiles for 5,000 items as for 1,000", () => {
    stubLayout();
    renderGrid(1_000);
    const mounted = tiles().length;
    renderGrid(5_000);

    const rowsOnScreen = Math.ceil(
      window.innerHeight /
        (INVENTORY_GRID_ESTIMATED_ROW_HEIGHT + INVENTORY_GRID_GAP)
    );
    expect(mounted).toBeGreaterThan(0);
    expect(tiles()).toHaveLength(mounted);
    expect(mounted).toBeLessThanOrEqual(
      (rowsOnScreen + INVENTORY_GRID_OVERSCAN_ROWS * 2) *
        INVENTORY_GRID_DEFAULT_COLUMNS
    );
  });

  test("renders the rows the window scrolls to", () => {
    stubLayout();
    renderGrid(1_000);

    scrollTo(100 * (INVENTORY_GRID_ESTIMATED_ROW_HEIGHT + INVENTORY_GRID_GAP));

    expect(tiles()).toContain(600);
    expect(tiles()).not.toContain(0);
  });

  test("follows the grid when content above it moves it down", () => {
    stubLayout();
    renderGrid(1_000);

    gridTop = 5_000;
    scrollTo(gridTop);

    expect(tiles()).toContain(0);
  });

  test("fits as many columns as auto-fit would", () => {
    stubLayout({ width: 344 });
    renderGrid(10);

    expect(row(0)?.children).toHaveLength(2);
  });

  test("keeps a fixed column count however narrow it is", () => {
    stubLayout({ width: 344 });
    renderGrid(10, { fixedColumns: 6 });

    expect(row(0)?.children).toHaveLength(6);
    expect(row(1)?.children).toHaveLength(4);
  });

  test("remounts at the height it measured, so scroll restoration lands", () => {
    stubLayout({ rowHeight: 200 });
    vi.stubGlobal("innerHeight", 100 * (200 + INVENTORY_GRID_GAP));
    renderGrid(1_000, { layoutKey: "same-list" });
    const measured = height();

    remount();
    vi.stubGlobal("innerHeight", 768);
    renderGrid(1_000, { layoutKey: "same-list" });

    expect(row(50)).toBeNull();
    expect(height()).toBe(measured);
  });

  test("remounts a different list from estimates, not the heights it measured", () => {
    stubLayout({ rowHeight: 200 });
    vi.stubGlobal("innerHeight", 100 * (200 + INVENTORY_GRID_GAP));
    renderGrid(1_000, { layoutKey: "other-list" });
    const measured = height();

    remount();
    vi.stubGlobal("innerHeight", 768);
    renderGrid(1_000, { firstUid: 1_000, layoutKey: "other-list" });

    expect(row(50)).toBeNull();
    expect(height()).not.toBe(measured);
  });
});

describe("InventoryGrid on the server", () => {
  test("renders no tiles, only the grid's estimated height", () => {
    const html = renderToString(
      <InventoryGrid items={getItems(1_000)} layoutKey="ssr">
        {({ uid }) => <div data-tile={uid} />}
      </InventoryGrid>
    );

    const rows = Math.ceil(1_000 / INVENTORY_GRID_DEFAULT_COLUMNS);
    expect(html).not.toContain("data-tile");
    expect(html).toContain(
      `height:${
        rows * INVENTORY_GRID_ESTIMATED_ROW_HEIGHT +
        (rows - 1) * INVENTORY_GRID_GAP
      }px`
    );
  });
});
