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
  useMemo,
  useRef,
  useState
} from "react";
import { ClientOnly } from "remix-utils/client-only";
import { getGridColumns, getGridRow, getGridRowCount } from "~/shared/grid";

export const INVENTORY_GRID_DEFAULT_COLUMNS = 6;
export const INVENTORY_GRID_ESTIMATED_ROW_HEIGHT = 150;
export const INVENTORY_GRID_GAP = 16;
export const INVENTORY_GRID_MIN_COLUMN_WIDTH = 154;
export const INVENTORY_GRID_OVERSCAN_ROWS = 2;

interface GridItem {
  uid: number;
}

interface InventoryGridLayout {
  columns: number;
  rowHeights: Map<VirtualItem["key"], number>;
  uids: number[];
}

const layouts = new Map<string, InventoryGridLayout>();

interface InventoryGridProps<T extends GridItem> {
  children: (item: T) => ReactNode;
  className?: string;
  columnGap?: number;
  fixedColumns?: number;
  items: T[];
  layoutKey: string;
}

export function InventoryGrid<T extends GridItem>(
  props: InventoryGridProps<T>
) {
  const { className, fixedColumns, items } = props;
  const rows = getGridRowCount(
    items.length,
    fixedColumns ?? INVENTORY_GRID_DEFAULT_COLUMNS
  );

  return (
    <div className={className}>
      <ClientOnly
        fallback={
          <div
            style={{
              height:
                rows === 0
                  ? 0
                  : rows * INVENTORY_GRID_ESTIMATED_ROW_HEIGHT +
                    (rows - 1) * INVENTORY_GRID_GAP
            }}
          />
        }
        children={() => <InventoryGridRows {...props} />}
      />
    </div>
  );
}

export function InventoryPageGrid<T extends GridItem>({
  children,
  items,
  layoutKey
}: Pick<InventoryGridProps<T>, "children" | "items" | "layoutKey">) {
  return (
    <InventoryGrid
      className="m-auto w-full px-2 select-none lg:my-8 lg:w-5xl lg:px-0"
      items={items}
      layoutKey={layoutKey}
    >
      {(item) => (
        <div className="flex items-start justify-center">{children(item)}</div>
      )}
    </InventoryGrid>
  );
}

function InventoryGridRows<T extends GridItem>({
  children,
  columnGap = INVENTORY_GRID_GAP,
  fixedColumns,
  items,
  layoutKey
}: InventoryGridProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const [remembered] = useState(() => layouts.get(layoutKey));
  const [fitColumns, setFitColumns] = useState(
    remembered?.columns ?? INVENTORY_GRID_DEFAULT_COLUMNS
  );
  const [scrollMargin, setScrollMargin] = useState(0);
  const columns = fixedColumns ?? fitColumns;
  const uids = useMemo(() => items.map(({ uid }) => uid), [items]);
  const rowHeights = useMemo(
    () =>
      remembered !== undefined &&
      remembered.columns === columns &&
      remembered.uids.length === uids.length &&
      remembered.uids.every((uid, index) => uid === uids[index])
        ? remembered.rowHeights
        : undefined,
    [remembered, columns, uids]
  );

  const virtualizer = useWindowVirtualizer<HTMLDivElement>({
    count: getGridRowCount(items.length, columns),
    estimateSize: (index) =>
      rowHeights?.get(index) ?? INVENTORY_GRID_ESTIMATED_ROW_HEIGHT,
    gap: INVENTORY_GRID_GAP,
    overscan: INVENTORY_GRID_OVERSCAN_ROWS,
    scrollMargin
  });

  useLayoutEffect(() => {
    const list = listRef.current;
    if (list === null) {
      return;
    }
    const measureOffset = () =>
      setScrollMargin(list.getBoundingClientRect().top + window.scrollY);
    const measure = () => {
      setFitColumns(
        getGridColumns({
          gap: columnGap,
          minColumnWidth: INVENTORY_GRID_MIN_COLUMN_WIDTH,
          width: list.clientWidth
        })
      );
      measureOffset();
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    observer.observe(document.body);
    window.addEventListener("scroll", measureOffset, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", measureOffset);
    };
  }, [columnGap]);

  const latest = useRef({ columns, rowHeights, uids });
  latest.current = { columns, rowHeights, uids };
  useEffect(
    () => () => {
      const { columns, rowHeights, uids } = latest.current;
      layouts.set(layoutKey, {
        columns,
        rowHeights: new Map([
          ...(rowHeights ?? []),
          ...virtualizer.itemSizeCache
        ]),
        uids
      });
    },
    [layoutKey, virtualizer]
  );

  const gridTemplateColumns = `repeat(${columns}, minmax(${
    fixedColumns === undefined ? `${INVENTORY_GRID_MIN_COLUMN_WIDTH}px` : 0
  }, 1fr))`;

  return (
    <div
      className="relative"
      ref={listRef}
      style={{ height: virtualizer.getTotalSize() }}
    >
      {virtualizer.getVirtualItems().map(({ index, key, start }) => (
        <div
          className="absolute left-0 grid w-full"
          data-index={index}
          key={key}
          ref={virtualizer.measureElement}
          style={{ columnGap, gridTemplateColumns, top: start - scrollMargin }}
        >
          {getGridRow(items, columns, index).map((item) => (
            <Fragment key={item.uid}>{children(item)}</Fragment>
          ))}
        </div>
      ))}
    </div>
  );
}
