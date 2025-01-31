/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { ComponentProps } from "react";

export function ModalButton({
  children,
  className,
  forwardRef,
  variant,
  ...props
}: ComponentProps<"button"> & {
  forwardRef?: typeof props.ref;
  variant: "primary" | "secondary";
}) {
  return (
    <button
      className={clsx([
        className,
        "flex h-9 cursor-default items-center rounded-sm px-3 font-display font-bold uppercase drop-shadow-lg transition [font-stretch:62.5%]",
        variant === "primary" &&
          "bg-green-700/80 text-neutral-200 hover:bg-green-600 disabled:bg-green-900 disabled:text-green-600",
        variant === "secondary" &&
          "text-neutral-100 hover:bg-neutral-500/30 hover:text-white disabled:bg-transparent disabled:text-neutral-700"
      ])}
      {...props}
      ref={forwardRef}
    >
      {children}
    </button>
  );
}
