/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ComponentProps } from "react";
import { TooltipBubble, useTooltip } from "./tooltip";

export function ButtonWithTooltip({
  tooltip,
  ...props
}: ComponentProps<"button"> & {
  tooltip?: string;
}) {
  const {
    getReferenceProps,
    setReference,
    tooltip: bubble
  } = useTooltip({
    durationMs: 500,
    includeFocus: true,
    offsetPx: 20,
    placement: "bottom"
  });
  return (
    <>
      <button {...props} ref={setReference} {...getReferenceProps()} />
      <TooltipBubble {...bubble}>{tooltip}</TooltipBubble>
    </>
  );
}
