/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { ComponentProps } from "react";

export function EditorInput({
  inflexible,
  pattern,
  unstyled,
  validate,
  ...props
}: Omit<ComponentProps<"input">, "pattern" | "value"> & {
  inflexible?: boolean;
  pattern?: RegExp;
  unstyled?: boolean;
  validate?(value?: string): boolean;
  value?: string;
}) {
  const invalid =
    (pattern !== undefined &&
      typeof props.value === "string" &&
      props.value !== "" &&
      pattern.exec(props.value.trim()) === null) ||
    (validate !== undefined && !validate(props.value));

  return (
    <input
      {...props}
      className={clsx(
        "placeholder-neutral-600 outline-none first-line:rounded",
        !inflexible && "w-0 min-w-0 flex-1",
        !unstyled && "px-1",
        invalid ? "bg-red-500/50" : unstyled ? "bg-transparent" : "bg-black/50",
        props.className
      )}
    />
  );
}
