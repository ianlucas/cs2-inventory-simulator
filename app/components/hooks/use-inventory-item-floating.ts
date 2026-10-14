/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  autoUpdate,
  ElementProps,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useHover,
  useInteractions,
  useMergeRefs,
  useRole
} from "@floating-ui/react";
import { useMemo, useState } from "react";
import { useFloatingClick } from "./use-floating-click";

export function useInventoryItemFloating({
  rightClick = false
}: {
  /** Opens the click menu on right-click only, leaving left-click free. */
  rightClick?: boolean;
} = {}) {
  const [isClickOpen, setIsClickOpen] = useState(false);
  const [isHoverOpen, setIsHoverOpen] = useState(false);

  const {
    refs: clickRefs,
    floatingStyles: clickStyles,
    context: clickContext
  } = useFloating({
    open: isClickOpen,
    onOpenChange: setIsClickOpen,
    middleware: [offset(10), flip(), shift()],
    whileElementsMounted: autoUpdate,
    placement: "right"
  });

  const {
    refs: hoverRefs,
    floatingStyles: hoverStyles,
    context: hoverContext
  } = useFloating({
    open: isHoverOpen,
    onOpenChange: setIsHoverOpen,
    middleware: [offset(10), flip(), shift()],
    whileElementsMounted: autoUpdate,
    placement: "right"
  });

  const click = useFloatingClick(clickContext);
  const contextMenu = useMemo<ElementProps>(
    () => ({
      reference: {
        onContextMenu(event) {
          event.preventDefault();
          clickContext.onOpenChange(true, event.nativeEvent);
        },
        onPointerDown(event) {
          if (event.button === 0) {
            clickContext.onOpenChange(false, event.nativeEvent);
          }
        }
      }
    }),
    [clickContext.onOpenChange]
  );
  const dismiss = useDismiss(clickContext);
  const role = useRole(clickContext);
  const hover = useHover(hoverContext);

  const {
    getReferenceProps: getClickReferenceProps,
    getFloatingProps: getClickFloatingProps
  } = useInteractions([rightClick ? contextMenu : click, dismiss, role]);

  const {
    getReferenceProps: getHoverReferenceProps,
    getFloatingProps: getHoverFloatingProps
  } = useInteractions([hover]);

  const ref = useMergeRefs([clickRefs.setReference, hoverRefs.setReference]);

  return {
    clickContext,
    clickRefs,
    clickStyles,
    getClickFloatingProps,
    getClickReferenceProps,
    getHoverFloatingProps,
    getHoverReferenceProps,
    hoverContext,
    hoverRefs,
    hoverStyles,
    isClickOpen,
    isHoverOpen,
    ref,
    setIsClickOpen,
    setIsHoverOpen
  };
}
