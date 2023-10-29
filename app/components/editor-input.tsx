/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { ComponentProps } from "react";

export function EditorInput(
  {
    pattern,
    ...props
  }: Omit<ComponentProps<"input">, "pattern"> & {
    pattern?: RegExp;
  }
) {
  const invalid = pattern !== undefined
    && typeof props.value === "string"
    && props.value !== ""
    && pattern.exec(props.value.trim()) === null;

  return (
    <input
      className={clsx(
        "outline-none rounded px-1 flex-1 placeholder-neutral-600",
        invalid ? "bg-red-500/50" : "bg-black/50"
      )}
      {...props}
    />
  );
}
