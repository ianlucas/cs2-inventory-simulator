/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { ReactNode } from "react";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import { Zoom } from "react-awesome-reveal";

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
            <Zoom duration={200}>
              <div
                className={clsx(
                  "min-h-[inherit] rounded border border-white/10 bg-neutral-900 text-white shadow-lg drop-shadow-lg lg:bg-neutral-900 lg:bg-opacity-[0.98] lg:backdrop-blur-sm",
                  className
                )}
              >
                {children}
              </div>
            </Zoom>
          </div>,
          document.body
        )
      }
    />
  );
}
