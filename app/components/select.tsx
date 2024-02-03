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
  onChange,
  options,
  value
}: {
  children?: (option: T) => ReactNode;
  onChange: (value: string) => void;
  options: T[];
  value: string;
}) {
  children = children !== undefined ? children : ({ value }) => value;
  const [isOpen, setIsOpen] = useState(false);
  const ref = useClickAway(() => {
    setIsOpen(false);
  });
  const selected = options.find((option) => option.value === value)!;

  return (
    <div className="relative">
      <button
        className="flex min-w-[253px] cursor-default items-center gap-2 rounded bg-black/20 px-2 py-1 hover:bg-black/40"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex flex-1 items-center gap-2">
          {children(selected)}
        </div>
        <FontAwesomeIcon icon={faCaretDown} className="h-4" />
      </button>
      {isOpen && (
        <div
          className="absolute left-0 z-10 max-h-[128px] min-w-[253px] overflow-y-scroll bg-neutral-800"
          ref={ref as any}
        >
          {options.map((option) => {
            return (
              <button
                key={option.value}
                className={clsx(
                  "flex w-full cursor-default items-center gap-2 px-2 py-1 transition-all",
                  value === option.value && "bg-white/50",
                  value !== option.value && "hover:bg-black/30"
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
