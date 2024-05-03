/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { ComponentRef, ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";

export function Modal({
  blur,
  children,
  className,
  fixed,
  hidden
}: {
  blur?: boolean;
  children: ReactNode;
  className?: string;
  fixed?: boolean;
  hidden?: boolean;
}) {
  const ref = useRef<ComponentRef<"div">>(null);

  useEffect(() => {
    if (ref.current !== null) {
      document.body.append(ref.current);
    }
  }, [hidden]);

  return (
    <ClientOnly
      children={() =>
        createPortal(
          <div
            className={clsx(
              hidden ? "hidden" : fixed ? "fixed" : "absolute",
              "left-0 top-0 z-50 flex min-h-full w-full select-none items-center justify-center",
              blur && "bg-black/50 lg:bg-transparent lg:backdrop-blur-[2px]"
            )}
            ref={ref}
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
