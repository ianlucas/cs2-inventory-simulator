/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useHover,
  useInteractions,
  useRole,
  useTransitionStyles
} from "@floating-ui/react";
import { useState } from "react";

export function IconWithTooltip({
  src,
  tooltip
}: {
  src: string;
  tooltip: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: "top",
    // Make sure the tooltip stays on the screen
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(12),
      flip({
        fallbackAxisSideDirection: "start"
      }),
      shift()
    ]
  });

  const hover = useHover(context, { move: false });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    dismiss,
    role
  ]);

  const { isMounted, styles } = useTransitionStyles(context, {
    duration: 500,
    initial: {
      opacity: 0
    },
    open: {
      opacity: 1
    }
  });

  return (
    <>
      <img
        ref={refs.setReference}
        {...getReferenceProps()}
        src={src}
        alt={tooltip}
        className="pointer-events-auto h-7.5 opacity-90"
        draggable={false}
      />
      <FloatingPortal>
        {isOpen && isMounted && (
          <div
            role="tooltip"
            className="z-80"
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
          >
            <div
              className="rounded-sm bg-neutral-900/90 px-4 py-3.5 text-xs text-neutral-200 shadow-sm"
              style={styles}
            >
              {tooltip}
            </div>
          </div>
        )}
      </FloatingPortal>
    </>
  );
}
