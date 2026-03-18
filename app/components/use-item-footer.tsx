/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { ReactNode } from "react";

export function UseItemFooter({
  className,
  left,
  right
}: {
  className?: string;
  left?: ReactNode;
  right: ReactNode;
}) {
  return (
    <div
      className={clsx(
        className ?? "max-w-5xl lg:w-5xl",
        "m-auto flex min-h-15.75 items-center justify-between border-t border-t-white/10 pt-1.5 drop-shadow-sm"
      )}
    >
      {left}
      <div className="flex flex-1 items-center justify-end gap-2 text-lg">
        {right}
      </div>
    </div>
  );
}
