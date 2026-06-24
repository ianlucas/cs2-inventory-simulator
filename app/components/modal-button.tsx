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
  uppercaseless,
  variant,
  ...props
}: ComponentProps<"button"> & {
  forwardRef?: typeof props.ref;
  uppercaseless?: boolean;
  variant: "primary" | "secondary" | "tertiary" | "danger";
}) {
  return (
    <button
      className={clsx([
        className,
        !uppercaseless && "uppercase",
        "font-display pointer-events-auto relative flex h-9 cursor-default items-center rounded-xs px-3 font-bold font-stretch-[62.5%] drop-shadow-lg transition",
        variant === "primary" &&
          "bg-green-700/80 text-neutral-200 hover:bg-green-600 disabled:bg-green-900 disabled:text-green-600",
        variant === "secondary" &&
          "text-neutral-100 hover:bg-neutral-500/30 hover:text-white disabled:bg-transparent disabled:text-neutral-700",
        variant === "tertiary" &&
          "border border-neutral-100/90 text-neutral-100 hover:bg-neutral-800/30 hover:text-white disabled:bg-transparent disabled:text-neutral-700",
        variant === "danger" &&
          "bg-red-800/80 text-neutral-200 hover:bg-red-700 disabled:bg-red-950 disabled:text-red-700"
      ])}
      {...props}
      ref={forwardRef}
    >
      {children}
    </button>
  );
}
