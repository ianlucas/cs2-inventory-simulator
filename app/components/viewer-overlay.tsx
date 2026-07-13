/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { ComponentProps, ReactNode } from "react";
import { createPortal } from "react-dom";
import { useOverlayTransition } from "./hooks/use-overlay-transition";
import { Viewer } from "./viewer";

export function ViewerOverlay({
  children,
  header,
  overlayClassName,
  viewerClassName,
  viewerProps
}: {
  children?: ReactNode;
  header: ReactNode;
  overlayClassName?: string;
  viewerClassName?: string;
  viewerProps: Omit<ComponentProps<typeof Viewer>, "className" | "style">;
}) {
  const transition = useOverlayTransition();
  return createPortal(
    <div
      className={clsx(
        "fixed top-0 left-0 z-50 size-full overflow-hidden backdrop-blur-xs select-none",
        transition.className,
        overlayClassName
      )}
      {...transition.rootProps}
    >
      <Viewer
        {...viewerProps}
        className={clsx("size-full border-0 bg-transparent", viewerClassName)}
        // An iframe whose color-scheme differs from its document gets an opaque
        // backdrop; reset it so the viewer shows through.
        style={{ colorScheme: "normal" }}
      />
      <div className="pointer-events-none absolute top-0 left-0 w-full pt-8 text-center">
        {header}
      </div>
      {children}
    </div>,
    document.body
  );
}
