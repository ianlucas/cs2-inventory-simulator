/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { ReactNode } from "react";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";

export function Modal({
  blur,
  className,
  children
}: {
  blur?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <ClientOnly>
      {() =>
        createPortal(
          <div
            className={clsx(
              "absolute top-0 left-0 w-full min-h-full flex items-center justify-center z-50",
              blur && "bg-black/50 lg:bg-transparent lg:backdrop-blur-[2px]"
            )}
          >
            <div
              className={clsx(
                "shadow-lg rounded bg-neutral-900 lg:bg-neutral-900/95 min-h-[inherit] text-white lg:backdrop-blur-sm drop-shadow-lg border border-white/10",
                className
              )}
            >
              {children}
            </div>
          </div>,
          document.body
        )}
    </ClientOnly>
  );
}
