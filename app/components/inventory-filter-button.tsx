/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { ComponentProps } from "react";

export function InventoryFilterButton({
  active,
  children,
  shadowless,
  ...props
}: ComponentProps<"button"> & {
  active?: boolean;
  shadowless?: boolean;
}) {
  return (
    <button
      {...props}
      className={clsx(
        "cursor-default rounded-sm px-2 py-1 font-display text-sm font-medium uppercase transition-all hover:bg-neutral-500/40",
        active && "bg-cyan-600/40 text-cyan-400"
      )}
    >
      <span
        className={clsx(
          !active && !shadowless && "drop-shadow-[0_0_5px_rgba(0,0,0,1)]"
        )}
      >
        {children}
      </span>
    </button>
  );
}
