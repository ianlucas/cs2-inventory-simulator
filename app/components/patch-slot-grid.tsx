/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faBan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS2BaseInventoryItem,
  CS2Economy,
  CS2EconomyItem,
  CS2_MAX_PATCHES
} from "@ianlucas/cs2-lib";
import { ReactNode } from "react";
import { range } from "~/utils/number";
import { useRules, useTranslate } from "./app-context";
import { ItemImage } from "./item-image";

export function PatchSlotGrid({
  disabled,
  onSlotClick,
  renderSlotOverlay,
  value
}: {
  disabled?: boolean;
  onSlotClick: (index: number) => void;
  renderSlotOverlay?: (index: number, item: CS2EconomyItem) => ReactNode;
  value: NonNullable<CS2BaseInventoryItem["patches"]>;
}) {
  const translate = useTranslate();
  const { inventoryItemMaxPatches } = useRules();
  const isCapped = Object.keys(value).length >= inventoryItemMaxPatches;
  return (
    <div className="grid grid-cols-5 gap-1">
      {range(CS2_MAX_PATCHES).map((index) => {
        const patchId = value[index];
        const item =
          patchId !== undefined ? CS2Economy.getById(patchId) : undefined;
        const isSlotDisabled = disabled || (item === undefined && isCapped);
        return (
          <div className="relative aspect-256/192" key={index}>
            <button
              disabled={isSlotDisabled}
              className="absolute size-full cursor-default overflow-hidden bg-neutral-950/40"
              onClick={() => onSlotClick(index)}
            >
              {item !== undefined ? (
                <ItemImage item={item} />
              ) : (
                <div className="flex items-center justify-center text-neutral-700">
                  {isSlotDisabled && isCapped ? (
                    <FontAwesomeIcon icon={faBan} className="h-3" />
                  ) : (
                    translate("PatchPickerNA")
                  )}
                </div>
              )}
              {!isSlotDisabled && (
                <div className="absolute top-0 left-0 size-full border-2 border-transparent hover:border-blue-500/50" />
              )}
            </button>
            {item !== undefined &&
              !disabled &&
              renderSlotOverlay?.(index, item)}
          </div>
        );
      })}
    </div>
  );
}
