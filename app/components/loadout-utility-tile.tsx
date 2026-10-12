/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Placement } from "@floating-ui/react";
import { LoadoutIcon } from "./loadout-icon";
import { LoadoutTooltip } from "./loadout-tooltip";
import { TooltipBubble, useTooltip } from "./tooltip";

export function LoadoutUtilityTile({
  modelKey,
  name,
  tooltipPlacement
}: {
  modelKey: string;
  name: string;
  tooltipPlacement: Placement;
}) {
  const { getReferenceProps, setReference, tooltip } = useTooltip({
    durationMs: 150,
    offsetPx: 8,
    placement: tooltipPlacement
  });

  return (
    <>
      <div
        className="flex flex-1 items-center justify-center bg-black/15"
        ref={setReference}
        {...getReferenceProps()}
      >
        <LoadoutIcon
          className="size-7 text-black/95 opacity-60"
          src={`/images/vectors/equipment/${modelKey}.svg`}
        />
      </div>
      <TooltipBubble {...tooltip}>
        <LoadoutTooltip modelKey={modelKey} name={name} />
      </TooltipBubble>
    </>
  );
}
