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
        "relative inline-flex items-center cursor-pointer",
        className
      )}
    >
      <input {...props} type="checkbox" className="sr-only peer" />
      <div className="w-9 h-5 peer-focus:outline-none rounded-full peer bg-black/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600">
      </div>
    </label>
  );
}
