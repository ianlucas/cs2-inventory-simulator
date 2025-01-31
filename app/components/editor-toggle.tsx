/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { ComponentProps, ElementRef, MouseEvent, useRef } from "react";

export function EditorToggle({
  className,
  checkedLabel,
  uncheckedLabel,
  ...props
}: ComponentProps<"input"> & {
  checkedLabel?: string;
  uncheckedLabel?: string;
}) {
  const wrapperRef = useRef<ElementRef<"div">>(null);

  function handleClick(event: MouseEvent<HTMLElement>) {
    if (event.target instanceof HTMLInputElement) {
      return;
    }
    wrapperRef.current?.querySelector("input")?.click();
    event.preventDefault();
  }

  const label = props.checked ? checkedLabel : uncheckedLabel;

  return (
    <div
      className="group flex h-8 flex-1 items-center justify-end gap-2"
      onClick={handleClick}
      ref={wrapperRef}
    >
      {label !== undefined && <span>{label}</span>}
      <label className={clsx("relative inline-flex items-center", className)}>
        <input {...props} type="checkbox" className="peer sr-only" />
        <div
          className={clsx(
            "peer h-5 w-9 rounded-full bg-neutral-950/40 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:scale-90 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none",
            !props.disabled && "after:group-hover:scale-100"
          )}
        ></div>
      </label>
    </div>
  );
}
