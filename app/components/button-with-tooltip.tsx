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
  useFocus,
  useHover,
  useInteractions,
  useRole,
  useTransitionStyles
} from "@floating-ui/react";
import { ComponentProps, useState } from "react";

export function ButtonWithTooltip({
  tooltip,
  ...props
}: ComponentProps<"button"> & {
  tooltip?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: "bottom",
    // Make sure the tooltip stays on the screen
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(20),
      flip({
        fallbackAxisSideDirection: "start"
      }),
      shift()
    ]
  });

  const hover = useHover(context, { move: false });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
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
      <button {...props} ref={refs.setReference} {...getReferenceProps()} />
      <FloatingPortal>
        {tooltip !== undefined && isOpen && isMounted && (
          <div
            className="z-50"
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
