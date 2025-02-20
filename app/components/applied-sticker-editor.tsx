/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faEye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS2_MAX_STICKER_ROTATION,
  CS2_MAX_STICKER_WEAR,
  CS2_MIN_STICKER_ROTATION,
  CS2_MIN_STICKER_WEAR,
  CS2_STICKER_WEAR_FACTOR,
  CS2EconomyItem
} from "@ianlucas/cs2-lib";
import {
  generateInspectLink,
  isCommandInspect
} from "@ianlucas/cs2-lib-inspect";
import { useCopyToClipboard } from "@uidotdev/usehooks";
import clsx from "clsx";
import { useEffect } from "react";
import {
  maxStickerOffset,
  minStickerOffset,
  stickerOffsetFactor,
  stickerOffsetStringMaxLen,
  stickerOffsetToString,
  stickerRotationStringMaxLen,
  stickerWearStringMaxLen,
  stickerWearToString,
  validateStickerOffset,
  validateStickerRotation,
  validateStickerWear
} from "~/utils/economy";
import { createFakeInventoryItemFromBase } from "~/utils/inventory";
import { useLocalize } from "./app-context";
import { ButtonWithTooltip } from "./button-with-tooltip";
import { EditorItemDisplay } from "./editor-item-display";
import { EditorLabel } from "./editor-label";
import { EditorStepRangeWithInput } from "./editor-step-range-with-input";
import { useKeyValues } from "./hooks/use-key-values";
import { useTimedState } from "./hooks/use-timed-state";

export function AppliedStickerEditor({
  className,
  forItem,
  isHideStickerRotation,
  isHideStickerWear,
  isHideStickerX,
  isHideStickerY,
  item,
  onChange,
  slot,
  stickers,
  value
}: {
  className?: string;
  forItem?: CS2EconomyItem;
  isHideStickerRotation?: boolean;
  isHideStickerWear?: boolean;
  isHideStickerX?: boolean;
  isHideStickerY?: boolean;
  item: CS2EconomyItem;
  onChange?: (data: {
    rotation: number;
    wear: number;
    x: number;
    y: number;
  }) => void;
  slot?: number;
  stickers?: Record<
    string,
    { wear?: number; rotation?: number; x?: number; y?: number }
  >;
  value: { wear: number; rotation: number; x: number; y: number };
}) {
  const localize = useLocalize();
  const [, copyToClipboard] = useCopyToClipboard();
  const [copied, triggerCopied] = useTimedState();

  const attributes = useKeyValues(value);
  const isDisabled = false;
  const canPreviewItem =
    slot !== undefined && forItem !== undefined && stickers !== undefined;

  function handlePreview() {
    if (!canPreviewItem) {
      return;
    }

    const preview = {
      id: forItem.id,
      stickers: {
        ...stickers,
        [slot]: { id: item.id, ...attributes.value }
      }
    };
    const inspectLink = generateInspectLink(
      createFakeInventoryItemFromBase(preview)
    );
    const isCommand = isCommandInspect(inspectLink);
    copyToClipboard(inspectLink);
    if (isCommand) {
      triggerCopied();
    } else {
      window.location.assign(inspectLink);
    }
  }

  useEffect(() => {
    onChange?.(attributes.value);
  }, [attributes.value]);

  return (
    <div className={clsx("m-auto select-none", className)}>
      <EditorItemDisplay item={item} wear={attributes.value.wear} />
      <div className="space-y-1.5">
        {!isHideStickerWear && (
          <EditorLabel label={localize("EditorWear")}>
            <EditorStepRangeWithInput
              inputStyles="w-24 min-w-0"
              max={CS2_MAX_STICKER_WEAR}
              maxLength={stickerWearStringMaxLen}
              min={CS2_MIN_STICKER_WEAR}
              onChange={attributes.update("wear")}
              randomizable
              step={CS2_STICKER_WEAR_FACTOR}
              stepRangeStyles="flex-1"
              transform={stickerWearToString}
              type="float"
              validate={validateStickerWear}
              value={attributes.value.wear}
            />
          </EditorLabel>
        )}
        {!isHideStickerX && (
          <EditorLabel label={localize("EditorStickerX")}>
            <EditorStepRangeWithInput
              inputStyles="w-24 min-w-0"
              max={maxStickerOffset}
              maxLength={stickerOffsetStringMaxLen}
              min={minStickerOffset}
              onChange={attributes.update("x")}
              randomizable
              step={stickerOffsetFactor}
              stepRangeStyles="flex-1"
              transform={stickerOffsetToString}
              type="float"
              validate={validateStickerOffset}
              value={attributes.value.x}
            />
          </EditorLabel>
        )}
        {!isHideStickerY && (
          <EditorLabel label={localize("EditorStickerY")}>
            <EditorStepRangeWithInput
              inputStyles="w-24 min-w-0"
              max={maxStickerOffset}
              maxLength={stickerOffsetStringMaxLen}
              min={minStickerOffset}
              onChange={attributes.update("y")}
              randomizable
              step={stickerOffsetFactor}
              stepRangeStyles="flex-1"
              transform={stickerOffsetToString}
              type="float"
              validate={validateStickerOffset}
              value={attributes.value.y}
            />
          </EditorLabel>
        )}
        {!isHideStickerRotation && (
          <EditorLabel label={localize("EditorStickerRotation")}>
            <EditorStepRangeWithInput
              inputStyles="w-24 min-w-0"
              max={CS2_MAX_STICKER_ROTATION}
              maxLength={stickerRotationStringMaxLen}
              min={CS2_MIN_STICKER_ROTATION}
              onChange={attributes.update("rotation")}
              randomizable
              step={1}
              stepRangeStyles="flex-1"
              type="int"
              validate={validateStickerRotation}
              value={attributes.value.rotation}
            />
          </EditorLabel>
        )}
        <div className="flex justify-end">
          <ButtonWithTooltip
            tooltip={localize(
              copied ? "EditorCopiedToClipboard" : "EditorPreview"
            )}
            className="bg-black/10 p-2 text-neutral-300 transition hover:bg-black/30"
            onClick={handlePreview}
          >
            <FontAwesomeIcon icon={faEye} className="h-4" />
          </ButtonWithTooltip>
        </div>
      </div>
    </div>
  );
}
