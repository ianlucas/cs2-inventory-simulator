/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { ReactNode } from "react";

// A single line that slides back and forth when it overflows, or wraps
// instead when the user prefers reduced motion.
export function Marquee({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "@container block min-w-0 flex-1 overflow-x-clip text-left whitespace-nowrap motion-reduce:whitespace-normal",
        className
      )}
    >
      <span className="animate-marquee inline-block motion-reduce:animate-none">
        {children}
      </span>
    </span>
  );
}
