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

/**
 * Shared hover-tooltip wiring (floating-ui): positioning, the hover/focus/dismiss
 * interactions, and the fade transition. Returns the ref + reference props to spread onto
 * the trigger (a button, image, ...) and a `tooltip` bag to spread onto
 * {@link TooltipBubble}, which renders the floating bubble.
 *
 *     const { getReferenceProps, setReference, tooltip } = useTooltip({ placement: "top" });
 *     return (
 *       <>
 *         <button ref={setReference} {...getReferenceProps()} />
 *         <TooltipBubble {...tooltip}>{label}</TooltipBubble>
 *       </>
 *     );
 */
export function useTooltip({
  durationMs = 500,
  includeFocus = false,
  offsetPx = 12,
  placement = "top"
}: {
  durationMs?: number;
  // Also open on keyboard focus — for focusable triggers like buttons.
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
    // Keep the tooltip on screen as the trigger scrolls/moves.
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

/**
 * The floating bubble for {@link useTooltip}. Spread the hook's `tooltip` bag onto it and
 * pass the label as children; pass `multiline` for pre-formatted multi-line text.
 */
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
