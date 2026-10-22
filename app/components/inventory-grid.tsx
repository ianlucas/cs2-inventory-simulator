/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useWindowVirtualizer, VirtualItem } from "@tanstack/react-virtual";
import {
  Fragment,
  ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from "react";
import { ClientOnly } from "remix-utils/client-only";
import { getGridColumns, getGridRow, getGridRowCount } from "~/shared/grid";

export const INVENTORY_GRID_DEFAULT_COLUMNS = 6;
export const INVENTORY_GRID_ESTIMATED_ROW_HEIGHT = 150;
export const INVENTORY_GRID_OVERSCAN_ROWS = 2;

type Key = VirtualItem["key"];

// What each grid measured when it last unmounted, so mounting it again starts
// at its real height and scroll restoration lands where the user left.
const layouts = new Map<
  string,
  { columns: number; rowHeights: Map<Key, number> }
>();

interface InventoryGridProps<T> {
  children: (item: T) => ReactNode;
  className?: string;
  columnGap?: number;
  /** A fixed column count, instead of as many as fit `minColumnWidth`. */
  columns?: number;
  getKey: (item: T) => Key;
  items: T[];
  /** Names the grid, so it remembers its layout across remounts. */
  layoutKey: string;
  minColumnWidth?: number;
  rowGap?: number;
}

/** Renders only the rows of tiles near the viewport. */
export function InventoryGrid<T>(props: InventoryGridProps<T>) {
  const { className, columns, items, rowGap = 16 } = props;
  const rows = getGridRowCount(
    items.length,
    columns ?? INVENTORY_GRID_DEFAULT_COLUMNS
  );

  return (
    <div className={className}>
      <ClientOnly
        fallback={
          // The server can't tell which rows are on screen, so it only holds
          // the grid's estimated height for the client to fill in.
          <div
            style={{
              height:
                rows === 0
                  ? 0
                  : rows * INVENTORY_GRID_ESTIMATED_ROW_HEIGHT +
                    (rows - 1) * rowGap
            }}
          />
        }
        children={() => <InventoryGridRows {...props} />}
      />
    </div>
  );
}

function InventoryGridRows<T>({
  children,
  columnGap = 16,
  columns,
  getKey,
  items,
  layoutKey,
  minColumnWidth = 154,
  rowGap = 16
}: InventoryGridProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const [remembered] = useState(() => layouts.get(layoutKey));
  const [fitColumns, setFitColumns] = useState(
    remembered?.columns ?? INVENTORY_GRID_DEFAULT_COLUMNS
  );
  const [scrollMargin, setScrollMargin] = useState(0);
  const columnCount = columns ?? fitColumns;
  const rowHeights =
    remembered?.columns === columnCount ? remembered.rowHeights : undefined;

  const virtualizer = useWindowVirtualizer<HTMLDivElement>({
    count: getGridRowCount(items.length, columnCount),
    estimateSize: (index) =>
      rowHeights?.get(index) ?? INVENTORY_GRID_ESTIMATED_ROW_HEIGHT,
    gap: rowGap,
    overscan: INVENTORY_GRID_OVERSCAN_ROWS,
    scrollMargin
  });

  useLayoutEffect(() => {
    const list = listRef.current;
    if (list === null) {
      return;
    }
    const measure = () => {
      setFitColumns(
        getGridColumns({
          gap: columnGap,
          minColumnWidth,
          width: list.clientWidth
        })
      );
      setScrollMargin(list.getBoundingClientRect().top + window.scrollY);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    // Content above the grid growing or shrinking moves where it starts.
    observer.observe(document.body);
    return () => observer.disconnect();
  }, [columnGap, minColumnWidth]);

  const latest = useRef({ columnCount, rowHeights });
  latest.current = { columnCount, rowHeights };
  useEffect(
    () => () => {
      const { columnCount, rowHeights } = latest.current;
      layouts.set(layoutKey, {
        columns: columnCount,
        rowHeights: new Map([
          ...(rowHeights ?? []),
          ...virtualizer.itemSizeCache
        ])
      });
    },
    [layoutKey, virtualizer]
  );

  const gridTemplateColumns = `repeat(${columnCount}, minmax(${
    columns === undefined ? `${minColumnWidth}px` : 0
  }, 1fr))`;

  return (
    <div
      className="relative"
      ref={listRef}
      style={{ height: virtualizer.getTotalSize() }}
    >
      {virtualizer.getVirtualItems().map(({ index, key, start }) => (
        // Positioned by `top` rather than a transform, which would stack each
        // row on its own and hide context menus under the rows below.
        <div
          className="absolute left-0 grid w-full"
          data-index={index}
          key={key}
          ref={virtualizer.measureElement}
          style={{ columnGap, gridTemplateColumns, top: start - scrollMargin }}
        >
          {getGridRow(items, columnCount, index).map((item) => (
            <Fragment key={getKey(item)}>{children(item)}</Fragment>
          ))}
        </div>
      ))}
    </div>
  );
}
