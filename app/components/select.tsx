/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useClickAway } from "@uidotdev/usehooks";
import clsx from "clsx";
import { ReactNode, useState } from "react";

export function Select<T extends { value: string }>({
  children,
  className,
  direction,
  grayscale,
  noMaxHeight,
  onChange,
  options,
  optionsStyles,
  value
}: {
  children?: (option: T) => ReactNode;
  className?: string;
  direction?: "up" | "down";
  grayscale?: boolean;
  noMaxHeight?: boolean;
  onChange: (value: string) => void;
  options: T[];
  optionsStyles?: string;
  value: string;
}) {
  children ??= ({ value }) => value;
  direction ??= "down";
  const [isOpen, setIsOpen] = useState(false);
  const ref = useClickAway(() => {
    setIsOpen(false);
  });
  const selected = options.find((option) => option.value === value)!;

  return (
    <div className="relative">
      <button
        className={clsx(
          "flex cursor-default items-center gap-2 bg-black/20 px-2 py-1 hover:bg-black/40 focus:bg-black/40",
          isOpen
            ? direction === "down"
              ? "rounded-t"
              : "rounded-b"
            : "rounded",
          className ?? "min-w-[253px]"
        )}
        onClick={() => setIsOpen(true)}
      >
        <div className="flex flex-1 items-center gap-2">
          {children(selected)}
        </div>
        <FontAwesomeIcon icon={faCaretDown} className="h-4" />
      </button>
      {isOpen && (
        <div
          className={clsx(
            "absolute left-0 z-10 bg-neutral-800",
            isOpen
              ? direction === "down"
                ? "rounded-b"
                : "rounded-t"
              : undefined,
            direction === "up" && "bottom-full",
            className ?? "min-w-[253px]",
            !noMaxHeight && "max-h-[128px] overflow-y-scroll",
            optionsStyles
          )}
          ref={ref as any}
        >
          {options.map((option) => {
            return (
              <button
                key={option.value}
                className={clsx(
                  "flex w-full cursor-default items-center gap-2 px-2 py-1 transition-all",
                  value === option.value
                    ? grayscale
                      ? "bg-neutral-600/50"
                      : "bg-blue-600"
                    : grayscale
                      ? "hover:bg-black/30"
                      : "hover:bg-blue-600 hover:text-white"
                )}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {children !== undefined && children(option)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
