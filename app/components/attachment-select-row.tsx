/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem } from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { ReactNode, useState } from "react";
import { ItemImage } from "./item-image";

export interface AttachmentSelectEntry {
  index: number;
  item: CS2EconomyItem;
  label?: ReactNode;
}

export function AttachmentSelectRow({
  entries,
  onHover,
  onLeave,
  onSelect,
  selectedIndex
}: {
  entries: AttachmentSelectEntry[];
  onHover?: (index: number) => void;
  onLeave?: () => void;
  onSelect: (index: number) => void;
  selectedIndex: number | undefined;
}) {
  const [flashNonce, setFlashNonce] = useState(0);
  function handleSelect(index: number) {
    setFlashNonce((nonce) => nonce + 1);
    onSelect(index);
  }
  return (
    <div
      className="pointer-events-auto flex items-start justify-center gap-0"
      onMouseLeave={onLeave}
    >
      {entries.map(({ index, item, label }) => {
        const selected = index === selectedIndex;
        return (
          <button
            key={index}
            className="group relative flex flex-col items-center"
            onClick={() => handleSelect(index)}
            onMouseEnter={() => onHover?.(index)}
          >
            <div
              className={clsx(
                "relative drop-shadow-lg transition-all",
                selected
                  ? "scale-100 opacity-100"
                  : "scale-80 opacity-50 group-hover:scale-100"
              )}
            >
              <span
                className={clsx(
                  "pointer-events-none absolute -top-6 left-1/2 z-0 -translate-x-1/2 transition-all duration-200",
                  selected
                    ? "translate-y-0 opacity-100"
                    : "translate-y-1.5 opacity-0"
                )}
              >
                <span
                  key={selected ? `check-${flashNonce}` : "check"}
                  className={clsx(
                    "flex size-6.5 items-center justify-center rounded-full bg-green-600 shadow-md",
                    selected && "animate-[scrape-pop_450ms_ease-out]"
                  )}
                >
                  <img
                    alt=""
                    className="h-4.5"
                    draggable={false}
                    src="/images/vectors/check.svg"
                  />
                </span>
              </span>
              <div
                key={selected ? `pop-${flashNonce}` : "pop"}
                className={clsx(
                  "relative z-10",
                  selected && "animate-[scrape-pop_450ms_ease-out]"
                )}
              >
                <ItemImage className="w-32" item={item} />
              </div>
            </div>
            {label}
          </button>
        );
      })}
    </div>
  );
}
