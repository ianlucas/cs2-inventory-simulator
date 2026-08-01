/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { ReactNode } from "react";
import { useOverlayTransition } from "./hooks/use-overlay-transition";

export function InGameOverlay({
  children,
  header,
  overlayClassName
}: {
  children?: ReactNode;
  header: ReactNode;
  overlayClassName?: string;
}) {
  const transition = useOverlayTransition();
  return (
    <div
      className={clsx(
        "fixed top-0 left-0 z-50 size-full overflow-hidden bg-black/20 backdrop-blur-xs select-none",
        transition.className,
        overlayClassName
      )}
      {...transition.rootProps}
    >
      {children}
      <div className="pointer-events-none absolute top-0 left-0 w-full pt-8 text-center">
        {header}
      </div>
    </div>
  );
}
