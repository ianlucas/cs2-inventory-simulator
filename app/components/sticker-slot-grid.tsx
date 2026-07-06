/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2BaseInventoryItem,
  CS2Economy,
  CS2EconomyItem,
  CS2_MAX_STICKERS
} from "@ianlucas/cs2-lib";
import { ReactNode } from "react";
import { range } from "~/utils/number";
import { useTranslate } from "./app-context";
import { ItemImage } from "./item-image";

/**
 * The weapon's sticker slots as a fixed grid (one cell per markup slot): each filled slot
 * shows its sticker, empty slots show a placeholder, and clicking a slot calls
 * `onSlotClick`. Shared by the 2D {@link StickerPicker} and the 3D {@link Sticker3dPicker};
 * the 2D picker layers its per-slot remove/edit buttons on via `renderSlotOverlay`.
 */
export function StickerSlotGrid({
  disabled,
  onSlotClick,
  renderSlotOverlay,
  value
}: {
  disabled?: boolean;
  onSlotClick: (index: number) => void;
  // Extra controls drawn over a filled, enabled slot (e.g. remove/edit).
  renderSlotOverlay?: (index: number, item: CS2EconomyItem) => ReactNode;
  value: NonNullable<CS2BaseInventoryItem["stickers"]>;
}) {
  const translate = useTranslate();
  return (
    <div
      className="grid gap-1"
      style={{
        gridTemplateColumns: `repeat(${CS2_MAX_STICKERS}, minmax(0, 1fr))`
      }}
    >
      {range(CS2_MAX_STICKERS).map((index) => {
        const sticker = value[index];
        const item =
          sticker !== undefined ? CS2Economy.getById(sticker.id) : undefined;
        return (
          <div className="relative aspect-256/192" key={index}>
            <button
              disabled={disabled}
              className="absolute size-full cursor-default overflow-hidden bg-neutral-950/40"
              onClick={() => onSlotClick(index)}
            >
              {item !== undefined ? (
                <ItemImage item={item} />
              ) : (
                <div className="flex items-center justify-center text-neutral-700">
                  {translate("StickerPickerNA")}
                </div>
              )}
              {!disabled && (
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
