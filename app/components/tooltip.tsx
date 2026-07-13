/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  Placement,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
  useTransitionStyles
} from "@floating-ui/react";
import clsx from "clsx";
import { ReactNode, useState } from "react";

export function useTooltip({
  durationMs = 500,
  includeFocus = false,
  offsetPx = 12,
  placement = "top"
}: {
  durationMs?: number;
  includeFocus?: boolean;
  offsetPx?: number;
  placement?: Placement;
} = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    middleware: [
      offset(offsetPx),
      flip({ fallbackAxisSideDirection: "start" }),
      shift()
    ],
    onOpenChange: setIsOpen,
    open: isOpen,
    placement,
    whileElementsMounted: autoUpdate
  });
  const hover = useHover(context, { move: false });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    ...(includeFocus ? [focus] : []),
    dismiss,
    role
  ]);
  const { isMounted, styles } = useTransitionStyles(context, {
    duration: durationMs,
    initial: { opacity: 0 }
  });
  return {
    getReferenceProps,
    setReference: refs.setReference,
    tooltip: {
      floatingStyles,
      getFloatingProps,
      isMounted,
      isOpen,
      setFloating: refs.setFloating,
      styles
    }
  };
}

export function TooltipBubble({
  children,
  floatingStyles,
  getFloatingProps,
  isMounted,
  isOpen,
  multiline = false,
  setFloating,
  styles
}: ReturnType<typeof useTooltip>["tooltip"] & {
  children?: ReactNode;
  multiline?: boolean;
}) {
  return (
    <FloatingPortal>
      {isOpen && isMounted && children != null && (
        <div
          className="z-80"
          ref={setFloating}
          role="tooltip"
          style={floatingStyles}
          {...getFloatingProps()}
        >
          <div
            className={clsx(
              "rounded-sm bg-neutral-900/90 px-4 py-3.5 text-xs text-neutral-200 shadow-sm",
              multiline && "max-w-xs whitespace-pre-line"
            )}
            style={styles}
          >
            {children}
          </div>
        </div>
      )}
    </FloatingPortal>
  );
}
