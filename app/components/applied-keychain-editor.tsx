/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faArrowRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { CS2EconomyItem } from "@ianlucas/cs2-lib";
import {
  CS2_KEYCHAIN_OFFSET_FACTOR,
  CS2_MAX_KEYCHAIN_SEED,
  CS2_MIN_KEYCHAIN_SEED
} from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { useEffect } from "react";
import {
  getDefaultKeychainOffset,
  keychainOffsetStringMaxLen,
  keychainOffsetToString,
  keychainSeedStringMaxLen,
  validateKeychainOffset,
  validateKeychainSeed
} from "~/utils/economy";
import { useTranslate } from "./app-context";
import { ButtonWithTooltip } from "./button-with-tooltip";
import { EditorItemDisplay } from "./editor-item-display";
import { EditorLabel } from "./editor-label";
import { EditorStepRangeWithInput } from "./editor-step-range-with-input";
import { useKeyValues } from "./hooks/use-key-values";
import { confirm } from "./modal-generic";

export function AppliedKeychainEditor({
  className,
  forItem,
  isHideKeychainSeed,
  isHideKeychainX,
  isHideKeychainY,
  isHideKeychainZ,
  item,
  onChange,
  value
}: {
  className?: string;
  forItem?: CS2EconomyItem;
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
  const keychainOffsetXMin = forItem?.getMinimumKeychainOffsetX();
  const keychainOffsetXMax = forItem?.getMaximumKeychainOffsetX();
  const keychainOffsetYMin = forItem?.getMinimumKeychainOffsetY();
  const keychainOffsetYMax = forItem?.getMaximumKeychainOffsetY();
  const keychainOffsetZMin = forItem?.getMinimumKeychainOffsetZ();
  const keychainOffsetZMax = forItem?.getMaximumKeychainOffsetZ();

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
        x: getDefaultKeychainOffset(keychainOffsetXMin, keychainOffsetXMax),
        y: getDefaultKeychainOffset(keychainOffsetYMin, keychainOffsetYMax),
        z: getDefaultKeychainOffset(keychainOffsetZMin, keychainOffsetZMax)
      });
    }
  }

  useEffect(() => {
    onChange?.(attributes.value);
  }, [attributes.value]);

  return (
    <div className={clsx("m-auto text-sm select-none", className)}>
      <EditorItemDisplay item={item} />
      <div className="space-y-1.5">
        {!isHideKeychainSeed && (
          <EditorLabel label={translate("EditorPattern")}>
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
        {!isHideKeychainX &&
          keychainOffsetXMin !== undefined &&
          keychainOffsetXMax !== undefined && (
            <EditorLabel label={translate("EditorKeychainX")}>
              <EditorStepRangeWithInput
                inputStyles="w-24 min-w-0"
                max={keychainOffsetXMax}
                maxLength={keychainOffsetStringMaxLen(
                  keychainOffsetXMin,
                  keychainOffsetXMax
                )}
                min={keychainOffsetXMin}
                onChange={attributes.update("x")}
                randomizable
                step={CS2_KEYCHAIN_OFFSET_FACTOR}
                stepRangeStyles="flex-1"
                transform={keychainOffsetToString}
                type="float"
                validate={(value) =>
                  validateKeychainOffset(
                    value,
                    keychainOffsetXMin,
                    keychainOffsetXMax
                  )
                }
                value={attributes.value.x}
              />
            </EditorLabel>
          )}
        {!isHideKeychainY &&
          keychainOffsetYMin !== undefined &&
          keychainOffsetYMax !== undefined && (
            <EditorLabel label={translate("EditorKeychainY")}>
              <EditorStepRangeWithInput
                inputStyles="w-24 min-w-0"
                max={keychainOffsetYMax}
                maxLength={keychainOffsetStringMaxLen(
                  keychainOffsetYMin,
                  keychainOffsetYMax
                )}
                min={keychainOffsetYMin}
                onChange={attributes.update("y")}
                randomizable
                step={CS2_KEYCHAIN_OFFSET_FACTOR}
                stepRangeStyles="flex-1"
                transform={keychainOffsetToString}
                type="float"
                validate={(value) =>
                  validateKeychainOffset(
                    value,
                    keychainOffsetYMin,
                    keychainOffsetYMax
                  )
                }
                value={attributes.value.y}
              />
            </EditorLabel>
          )}
        {!isHideKeychainZ &&
          keychainOffsetZMin !== undefined &&
          keychainOffsetZMax !== undefined && (
            <EditorLabel label={translate("EditorKeychainZ")}>
              <EditorStepRangeWithInput
                inputStyles="w-24 min-w-0"
                max={keychainOffsetZMax}
                maxLength={keychainOffsetStringMaxLen(
                  keychainOffsetZMin,
                  keychainOffsetZMax
                )}
                min={keychainOffsetZMin}
                onChange={attributes.update("z")}
                randomizable
                step={CS2_KEYCHAIN_OFFSET_FACTOR}
                stepRangeStyles="flex-1"
                transform={keychainOffsetToString}
                type="float"
                validate={(value) =>
                  validateKeychainOffset(
                    value,
                    keychainOffsetZMin,
                    keychainOffsetZMax
                  )
                }
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
