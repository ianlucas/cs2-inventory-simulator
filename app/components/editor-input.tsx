/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { ComponentProps } from "react";

export function EditorInput({
  pattern,
  validate,
  ...props
}: Omit<ComponentProps<"input">, "pattern" | "value"> & {
  pattern?: RegExp;
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
        "w-0 min-w-0 flex-1 rounded px-1 placeholder-neutral-600 outline-none",
        invalid ? "bg-red-500/50" : "bg-black/50",
        props.className
      )}
    />
  );
}
