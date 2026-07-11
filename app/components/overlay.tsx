/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { ReactNode } from "react";
import { useOverlayTransition } from "./hooks/use-overlay-transition";

export function Overlay({
  className,
  children,
  isWrapperless
}: {
  className?: string;
  children: ReactNode;
  isWrapperless?: boolean;
}) {
  const transition = useOverlayTransition();
  return (
    <div
      className={clsx(
        "fixed top-0 left-0 z-50 flex size-full items-center justify-center bg-black/60 backdrop-blur-xs select-none",
        transition.className
      )}
      {...transition.rootProps}
    >
      {isWrapperless ? children : <div className={className}>{children}</div>}
    </div>
  );
}
