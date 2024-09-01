/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { ComponentProps } from "react";

export function EditorToggle({ className, ...props }: ComponentProps<"input">) {
  return (
    <label
      className={clsx(
        "relative inline-flex items-center",
        !props.disabled && "cursor-pointer",
        className
      )}
    >
      <input {...props} type="checkbox" className="peer sr-only" />
      <div className="peer h-5 w-9 rounded-full bg-black/50 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
    </label>
  );
}
