/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faArrowRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { CS2EconomyItem } from "@ianlucas/cs2-lib";
import {
  CS2_INVENTORY_RULES,
  CS2_KEYCHAIN_POSITION_FACTOR,
  CS2_MAX_KEYCHAIN_SEED,
  CS2_MIN_KEYCHAIN_SEED
} from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { useEffect } from "react";
import {
  getDefaultKeychainPosition,
  keychainPositionStringMaxLen,
  keychainPositionToString,
  keychainSeedStringMaxLen,
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
  const keychainPositionBounds = forItem?.getKeychainPositionBounds();
  const keychainPositionXMin = keychainPositionBounds?.x.min;
  const keychainPositionXMax = keychainPositionBounds?.x.max;
  const keychainPositionYMin = keychainPositionBounds?.y.min;
  const keychainPositionYMax = keychainPositionBounds?.y.max;
  const keychainPositionZMin = keychainPositionBounds?.z.min;
  const keychainPositionZMax = keychainPositionBounds?.z.max;

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
        x: getDefaultKeychainPosition(
          keychainPositionXMin,
          keychainPositionXMax
        ),
        y: getDefaultKeychainPosition(
          keychainPositionYMin,
          keychainPositionYMax
        ),
        z: getDefaultKeychainPosition(
          keychainPositionZMin,
          keychainPositionZMax
        )
      });
    }
  }

  useEffect(() => {
    onChange?.(attributes.value);
  }, [attributes.value]);

  return (
    <div className={clsx("m-auto text-sm select-none", className)}>
      <EditorItemDisplay item={item} seed={attributes.value.seed} />
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
          keychainPositionXMin !== undefined &&
          keychainPositionXMax !== undefined && (
            <EditorLabel label={translate("EditorKeychainX")}>
              <EditorStepRangeWithInput
                inputStyles="w-24 min-w-0"
                max={keychainPositionXMax}
                maxLength={keychainPositionStringMaxLen(
                  keychainPositionXMin,
                  keychainPositionXMax
                )}
                min={keychainPositionXMin}
                onChange={attributes.update("x")}
                step={CS2_KEYCHAIN_POSITION_FACTOR}
                stepRangeStyles="flex-1"
                transform={keychainPositionToString}
                type="float"
                validate={(value) =>
                  forItem !== undefined &&
                  CS2_INVENTORY_RULES.keychainPositionX.check(value, forItem)
                }
                value={attributes.value.x}
              />
            </EditorLabel>
          )}
        {!isHideKeychainY &&
          keychainPositionYMin !== undefined &&
          keychainPositionYMax !== undefined && (
            <EditorLabel label={translate("EditorKeychainY")}>
              <EditorStepRangeWithInput
                inputStyles="w-24 min-w-0"
                max={keychainPositionYMax}
                maxLength={keychainPositionStringMaxLen(
                  keychainPositionYMin,
                  keychainPositionYMax
                )}
                min={keychainPositionYMin}
                onChange={attributes.update("y")}
                step={CS2_KEYCHAIN_POSITION_FACTOR}
                stepRangeStyles="flex-1"
                transform={keychainPositionToString}
                type="float"
                validate={(value) =>
                  forItem !== undefined &&
                  CS2_INVENTORY_RULES.keychainPositionY.check(value, forItem)
                }
                value={attributes.value.y}
              />
            </EditorLabel>
          )}
        {!isHideKeychainZ &&
          keychainPositionZMin !== undefined &&
          keychainPositionZMax !== undefined && (
            <EditorLabel label={translate("EditorKeychainZ")}>
              <EditorStepRangeWithInput
                inputStyles="w-24 min-w-0"
                max={keychainPositionZMax}
                maxLength={keychainPositionStringMaxLen(
                  keychainPositionZMin,
                  keychainPositionZMax
                )}
                min={keychainPositionZMin}
                onChange={attributes.update("z")}
                step={CS2_KEYCHAIN_POSITION_FACTOR}
                stepRangeStyles="flex-1"
                transform={keychainPositionToString}
                type="float"
                validate={(value) =>
                  forItem !== undefined &&
                  CS2_INVENTORY_RULES.keychainPositionZ.check(value, forItem)
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
