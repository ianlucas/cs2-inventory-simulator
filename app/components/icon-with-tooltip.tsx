/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TooltipBubble, useTooltip } from "./tooltip";

export function IconWithTooltip({
  src,
  tooltip
}: {
  src: string;
  tooltip: string;
}) {
  const {
    getReferenceProps,
    setReference,
    tooltip: bubble
  } = useTooltip({
    offsetPx: 12,
    placement: "top"
  });
  return (
    <>
      <img
        ref={setReference}
        {...getReferenceProps()}
        src={src}
        alt={tooltip}
        className="pointer-events-auto h-7.5 opacity-90"
        draggable={false}
      />
      <TooltipBubble {...bubble}>{tooltip}</TooltipBubble>
    </>
  );
}
