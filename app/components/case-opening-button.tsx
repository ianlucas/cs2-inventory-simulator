/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { ComponentProps } from "react";

export function CaseOpeningButton({
  children,
  variant,
  ...props
}: ComponentProps<"button"> & {
  variant: "primary" | "secondary";
}) {
  return (
    <button
      className={clsx([
        "flex h-9 cursor-default items-center gap-2 rounded-sm font-semibold uppercase drop-shadow-lg transition",
        variant === "primary" &&
          "bg-green-700/80 text-neutral-200 hover:bg-green-600 disabled:bg-green-900 disabled:text-green-600",
        variant === "secondary" &&
          "px-2 text-neutral-100 hover:bg-neutral-500/30 hover:text-white disabled:bg-transparent disabled:text-neutral-700"
      ])}
      {...props}
    >
      <span className="scale-x-[0.8]">{children}</span>
    </button>
  );
}
