/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2_MAX_STICKER_WEAR,
  CS2_MIN_STICKER_WEAR,
  CS2_STICKER_WEAR_FACTOR,
  CS2EconomyItem
} from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { useEffect } from "react";
import { stickerWearStringMaxLen, stickerWearToString } from "~/utils/economy";
import { useLocalize } from "./app-context";
import { EditorItemDisplay } from "./editor-item-display";
import { EditorLabel } from "./editor-label";
import { EditorStepRangeWithInput } from "./editor-step-range-with-input";
import { useKeyValues } from "./hooks/use-key-values";

export function AppliedStickerEditor({
  className,
  item,
  onChange,
  value
}: {
  className?: string;
  item: CS2EconomyItem;
  onChange?: (data: { wear: number }) => void;
  value: { wear: number };
}) {
  const localize = useLocalize();

  const attributes = useKeyValues(value);

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
      </div>
    </div>
  );
}
