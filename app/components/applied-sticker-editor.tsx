/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faEye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS2_MAX_STICKER_WEAR,
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
import { stickerWearStringMaxLen, stickerWearToString } from "~/utils/economy";
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
  item,
  onChange,
  slot,
  stickers,
  value
}: {
  className?: string;
  forItem?: CS2EconomyItem;
  item: CS2EconomyItem;
  onChange?: (data: { wear: number; x: number; y: number }) => void;
  slot?: number;
  stickers?: Record<string, { wear?: number; x?: number; y?: number }>;
  value: { wear: number; x: number; y: number };
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
        <EditorLabel label={localize("EditorStickerWear")}>
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
            validate={(value) =>
              value >= CS2_MIN_STICKER_WEAR && value <= CS2_MAX_STICKER_WEAR
            }
            value={attributes.value.wear}
          />
        </EditorLabel>
        <EditorLabel label={"X Offset_"}>
          <EditorStepRangeWithInput
            inputStyles="w-24 min-w-0"
            max={2}
            maxLength={5}
            min={-2}
            onChange={attributes.update("x")}
            randomizable
            step={0.0000001}
            stepRangeStyles="flex-1"
            transform={(value) => value.toFixed(5 - 2)}
            type="float"
            validate={(value) => value >= -2 && value <= 2}
            value={attributes.value.x}
          />
        </EditorLabel>
        <EditorLabel label={"X Offset_"}>
          <EditorStepRangeWithInput
            inputStyles="w-24 min-w-0"
            max={2}
            maxLength={5}
            min={-2}
            onChange={attributes.update("y")}
            randomizable
            step={0.0000001}
            stepRangeStyles="flex-1"
            transform={(value) => value.toFixed(5 - 2)}
            type="float"
            validate={(value) => value >= -2 && value <= 2}
            value={attributes.value.y}
          />
        </EditorLabel>
        <div className="flex justify-end">
          <ButtonWithTooltip
            tooltip={copied ? "Copied to the clipboard_" : "Preview_"}
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
