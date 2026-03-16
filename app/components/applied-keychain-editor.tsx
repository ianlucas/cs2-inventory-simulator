/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faArrowRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS2_MAX_KEYCHAIN_SEED,
  CS2_MIN_KEYCHAIN_SEED
} from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { useEffect } from "react";
import {
  keychainSeedStringMaxLen,
  maxStickerOffset,
  minStickerOffset,
  stickerOffsetFactor,
  stickerOffsetStringMaxLen,
  stickerOffsetToString,
  validateKeychainSeed,
  validateStickerOffset
} from "~/utils/economy";
import { useTranslate } from "./app-context";
import { ButtonWithTooltip } from "./button-with-tooltip";
import { EditorItemDisplay } from "./editor-item-display";
import { EditorLabel } from "./editor-label";
import { EditorStepRangeWithInput } from "./editor-step-range-with-input";
import { useKeyValues } from "./hooks/use-key-values";
import { confirm } from "./modal-generic";
import type { CS2EconomyItem } from "@ianlucas/cs2-lib";

export function AppliedKeychainEditor({
  className,
  isHideKeychainSeed,
  isHideKeychainX,
  isHideKeychainY,
  isHideKeychainZ,
  item,
  onChange,
  value
}: {
  className?: string;
  isHideKeychainSeed?: boolean;
  isHideKeychainX?: boolean;
  isHideKeychainY?: boolean;
  isHideKeychainZ?: boolean;
  item: CS2EconomyItem;
  onChange?: (data: { seed: number; x: number; y: number; z: number }) => void;
  value: { seed: number; x: number; y: number; z: number };
}) {
  const translate = useTranslate();
  const attributes = useKeyValues(value);

  async function handleReset() {
    if (
      await confirm({
        titleText: translate("EditorResetConfirmTitle"),
        bodyText: translate("EditorResetConfirm"),
        cancelText: translate("GenericNo"),
        confirmText: translate("GenericYes")
      })
    ) {
      attributes.setValue({
        seed: CS2_MIN_KEYCHAIN_SEED,
        x: 0,
        y: 0,
        z: 0
      });
    }
  }

  useEffect(() => {
    onChange?.(attributes.value);
  }, [attributes.value]);

  return (
    <div className={clsx("m-auto select-none", className)}>
      <EditorItemDisplay item={item} />
      <div className="space-y-1.5">
        {!isHideKeychainSeed && (
          <EditorLabel label={translate("EditorSeed")}>
            <EditorStepRangeWithInput
              inputStyles="w-24 min-w-0"
              max={CS2_MAX_KEYCHAIN_SEED}
              maxLength={keychainSeedStringMaxLen}
              min={CS2_MIN_KEYCHAIN_SEED}
              onChange={attributes.update("seed")}
              randomizable
              step={1}
              stepRangeStyles="flex-1"
              type="int"
              validate={validateKeychainSeed}
              value={attributes.value.seed}
            />
          </EditorLabel>
        )}
        {!isHideKeychainX && (
          <EditorLabel label={translate("EditorKeychainX")}>
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
        {!isHideKeychainY && (
          <EditorLabel label={translate("EditorKeychainY")}>
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
        {!isHideKeychainZ && (
          <EditorLabel label={translate("EditorKeychainZ")}>
            <EditorStepRangeWithInput
              inputStyles="w-24 min-w-0"
              max={maxStickerOffset}
              maxLength={stickerOffsetStringMaxLen}
              min={minStickerOffset}
              onChange={attributes.update("z")}
              randomizable
              step={stickerOffsetFactor}
              stepRangeStyles="flex-1"
              transform={stickerOffsetToString}
              type="float"
              validate={validateStickerOffset}
              value={attributes.value.z}
            />
          </EditorLabel>
        )}
        <div className="flex justify-end gap-1">
          <ButtonWithTooltip
            tooltip={translate("EditorReset")}
            className="bg-black/10 p-2 text-neutral-300 transition hover:bg-black/30"
            onClick={handleReset}
          >
            <FontAwesomeIcon icon={faArrowRotateLeft} className="h-4" />
          </ButtonWithTooltip>
        </div>
      </div>
    </div>
  );
}
