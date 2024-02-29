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
    <ClientOnly
      children={() =>
        createPortal(
          <div
            className={clsx(
              "absolute left-0 top-0 z-50 flex min-h-full w-full items-center justify-center",
              blur && "bg-black/50 lg:bg-transparent lg:backdrop-blur-[2px]"
            )}
          >
            <div
              className={clsx(
                "min-h-[inherit] rounded border border-white/10 bg-neutral-900 bg-opacity-[0.98] text-white shadow-lg drop-shadow-lg lg:backdrop-blur-sm",
                className
              )}
            >
              {children}
            </div>
          </div>,
          document.body
        )
      }
    />
  );
}
