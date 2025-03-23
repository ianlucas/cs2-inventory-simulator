/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, CS2EconomyItem, CS2ItemType } from "@ianlucas/cs2-lib";
import { ReactNode, useMemo, useState, WheelEvent } from "react";
import { range } from "~/utils/number";
import { useInput } from "./hooks/use-input";
import { ItemImage } from "./item-image";

export function paintableWithModelFilter(filter: string) {
  return function filterFn(item: CS2EconomyItem) {
    return (
      (item.glb || item.parent?.glb) &&
      item.isPaintable() &&
      (filter === "" || item.name.toLowerCase().includes(filter.toLowerCase()))
    );
  };
}

export function stickerFilter(filter: string) {
  return function filterFn(item: CS2EconomyItem) {
    return (
      item.type === CS2ItemType.Sticker &&
      (filter === "" || item.name.toLowerCase().includes(filter.toLowerCase()))
    );
  };
}

export function ToolsItemSelect({
  children,
  filterFunction,
  label,
  onChange,
  value
}: {
  children?: ReactNode;
  filterFunction: typeof paintableWithModelFilter;
  label?: string;
  onChange: (item: CS2EconomyItem) => void;
  value: CS2EconomyItem;
}) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [filter, setFilter] = useInput("");
  const [startAt, setStartAt] = useState(0);

  const items = useMemo(() => {
    return CS2Economy.itemsAsArray.filter(filterFunction(filter));
  }, [filter]);

  function handleScroll(deltaY: number) {
    const direction = deltaY > 0 ? 1 : -1;
    setStartAt((current) =>
      Math.min(Math.max(current + direction, 0), Math.max(items.length - 5, 0))
    );
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    handleScroll(event.deltaY);
  }

  return (
    <div key="item-select">
      <div>
        {label ?? "Item"}:{value.name}
      </div>
      {children}
      <input
        className="h-6 rounded border px-1"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={setFilter}
        value={filter}
      />
      {(focused || hovered) && items.length > 0 && (
        <div
          className="absolute mt-2 w-64 divide-y rounded border text-xs backdrop-blur-md"
          onWheel={handleWheel}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {range(5).map((index) => {
            const item = items[startAt + index];
            return item ? (
              <button
                key={item.id}
                className="flex w-full items-center hover:bg-black/50"
                onClick={() => onChange(item)}
              >
                <ItemImage className="h-16" item={item} />
                <span className="text-left whitespace-pre-wrap">
                  {item.name.replaceAll("| ", "\n")}
                </span>
              </button>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}
