/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { ComponentProps, ReactNode } from "react";
import { createPortal } from "react-dom";
import { Viewer } from "./viewer";

/**
 * The full-screen shell shared by the 3D sticker flows (apply / scrape / picker): a portal
 * to document.body so the overlay fills the window (escaping any modal's containing block),
 * the viewer iframe behind everything, and the `header` pinned to the top. `children` hold
 * the flow-specific controls.
 *
 * Wrappers stay pointer-events-none so the space around the header/controls passes through
 * to the iframe, keeping the model orbitable; the controls opt back in. Only ever rendered
 * client-side (mounted on user action), so the portal needs no ClientOnly guard.
 */
export function ViewerOverlay({
  children,
  header,
  viewerClassName,
  viewerProps
}: {
  children?: ReactNode;
  header: ReactNode;
  // Extra classes merged onto the viewer iframe (e.g. dropping pointer events while a
  // drag in the controls needs them).
  viewerClassName?: string;
  viewerProps: Omit<ComponentProps<typeof Viewer>, "className" | "style">;
}) {
  return createPortal(
    <div className="fixed top-0 left-0 z-50 size-full overflow-hidden backdrop-blur-xs select-none">
      <Viewer
        {...viewerProps}
        className={clsx("size-full border-0 bg-transparent", viewerClassName)}
        // The app forces `color-scheme: dark`; an iframe whose scheme differs from its
        // document gets an opaque backdrop. Reset it so the viewer shows through.
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
