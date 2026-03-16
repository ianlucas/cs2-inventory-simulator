/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faArrowRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS2_MIN_SEED,
  CS2_MIN_WEAR,
  CS2_WEAR_FACTOR,
  CS2BaseInventoryItem,
  CS2Economy,
  CS2EconomyItem,
  CS2InventoryItem
} from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { useEffect } from "react";
import {
  isItemCountable,
  wearStringMaxLen,
  wearToString
} from "~/utils/economy";
import { hasKeys } from "~/utils/misc";
import { useTranslate } from "./app-context";
import { ButtonWithTooltip } from "./button-with-tooltip";
import { EditorInput } from "./editor-input";
import { EditorItemDisplay } from "./editor-item-display";
import { EditorLabel } from "./editor-label";
import { EditorStepRangeWithInput } from "./editor-step-range-with-input";
import { EditorToggle } from "./editor-toggle";
import { useKeyValues } from "./hooks/use-key-values";
import { KeychainPicker } from "./keychain-picker";
import { confirm } from "./modal-generic";
import { PatchPicker } from "./patch-picker";
import { StickerPicker } from "./sticker-picker";

export interface ItemEditorAttributes {
  keychains?: CS2BaseInventoryItem["keychains"];
  nameTag?: string;
  patches?: CS2BaseInventoryItem["patches"];
  quantity: number;
  seed?: number;
  statTrak?: boolean;
  stickers?: CS2BaseInventoryItem["stickers"];
  wear?: number;
}

export function ItemEditor({
  className,
  defaultQuantity,
  isDisabled,
  isHideKeychainSeed,
  isHideKeychains,
  isHideKeychainX,
  isHideKeychainY,
  isHideNameTag,
  isHidePatches,
  isHideSeed,
  isHideStatTrak,
  isHideStickerRotation,
  isHideStickerSchema,
  isHideStickers,
  isHideStickerWear,
  isHideStickerX,
  isHideStickerY,
  isHideWear,
  item,
  keychainFilter,
  maxQuantity,
  onChange,
  patchFilter,
  stickerFilter
}: {
  className?: string;
  defaultQuantity?: number;
  item: CS2InventoryItem | CS2EconomyItem;
  maxQuantity?: number;
  isDisabled?: boolean;
  isHideKeychainSeed?: boolean;
  isHideKeychains?: boolean;
  isHideKeychainX?: boolean;
  isHideKeychainY?: boolean;
  isHideNameTag?: boolean;
  isHidePatches?: boolean;
  isHideSeed?: boolean;
  isHideStatTrak?: boolean;
  isHideStickerRotation?: boolean;
  isHideStickerSchema?: boolean;
  isHideStickers?: boolean;
  isHideStickerWear?: boolean;
  isHideStickerX?: boolean;
  isHideStickerY?: boolean;
  isHideWear?: boolean;
  keychainFilter?: (item: CS2EconomyItem) => boolean;
  onChange?: (data: ItemEditorAttributes) => void;
  stickerFilter?: (item: CS2EconomyItem) => boolean;
  patchFilter?: (item: CS2EconomyItem) => boolean;
}) {
  maxQuantity ??= 0;

  const defaults = item instanceof CS2InventoryItem ? item.asBase() : undefined;

  const hasQuantity = !isDisabled && isItemCountable(item);
  const hasKeychains = !isHideKeychains && item.hasKeychains();
  const hasStickers = !isHideStickers && item.hasStickers();
  const hasPatches = !isHidePatches && item.hasPatches();
  const hasNameTag = !isHideNameTag && item.hasNametag();
  const hasSeed = !isHideSeed && item.hasSeed();
  const hasWear = !isHideWear && item.hasWear();
  const hasStatTrak = !isHideStatTrak && item.hasStatTrak();
  const minimumSeed = item.getMinimumSeed();
  const minimumWear = item.getMinimumWear();

  const translate = useTranslate();

  const attributes = useKeyValues({
    keychains: defaults?.keychains ?? {},
    nameTag: defaults?.nameTag ?? "",
    patches: defaults?.patches ?? {},
    quantity: defaultQuantity ?? 1,
    seed: defaults?.seed ?? minimumSeed,
    statTrak: defaults?.statTrak !== undefined,
    stickers: defaults?.stickers ?? {},
    wear: defaults?.wear ?? minimumWear
  });

  async function handleReset() {
    if (
      await confirm({
        titleText: translate("EditorResetConfirmTitle"),
        bodyText: translate("EditorResetConfirm"),
        cancelText: translate("GenericNo"),
        confirmText: translate("GenericYes")
      })
    ) {
      attributes.reset();
    }
  }

  useEffect(() => {
    onChange?.({
      keychains:
        hasKeychains && hasKeys(attributes.value.keychains)
          ? attributes.value.keychains
          : undefined,
      nameTag: hasNameTag
        ? attributes.value.nameTag.length > 0
          ? attributes.value.nameTag
          : undefined
        : undefined,
      patches:
        hasPatches && hasKeys(attributes.value.patches)
          ? attributes.value.patches
          : undefined,
      quantity: attributes.value.quantity,
      seed: hasSeed
        ? attributes.value.seed !== CS2_MIN_SEED
          ? attributes.value.seed
          : undefined
        : undefined,
      statTrak:
        hasStatTrak && attributes.value.statTrak
          ? attributes.value.statTrak
          : undefined,
      stickers:
        hasStickers && hasKeys(attributes.value.stickers)
          ? attributes.value.stickers
          : undefined,
      wear: hasWear
        ? attributes.value.wear !== CS2_MIN_WEAR
          ? attributes.value.wear
          : undefined
        : undefined
    });
  }, [attributes.value]);

  return (
    <div className={clsx("m-auto select-none", className)}>
      <EditorItemDisplay item={item} wear={attributes.value.wear} />
      <div className="space-y-1.5">
        {hasStickers && (
          <EditorLabel block label={translate("EditorStickers")}>
            <StickerPicker
              disabled={isDisabled}
              forItem={item}
              isHideStickerRotation={isHideStickerRotation}
              isHideStickerSchema={isHideStickerSchema}
              isHideStickerWear={isHideStickerWear}
              isHideStickerX={isHideStickerX}
              isHideStickerY={isHideStickerY}
              onChange={attributes.update("stickers")}
              stickerFilter={stickerFilter}
              value={attributes.value.stickers}
            />
          </EditorLabel>
        )}
        {hasPatches && (
          <EditorLabel block label={translate("EditorPatches")}>
            <PatchPicker
              patchFilter={patchFilter}
              disabled={isDisabled}
              value={attributes.value.patches}
              onChange={attributes.update("patches")}
            />
          </EditorLabel>
        )}
        {hasKeychains && (
          <EditorLabel block label={translate("EditorKeychains")}>
            <KeychainPicker
              disabled={isDisabled}
              isHideKeychainSeed={isHideKeychainSeed}
              isHideKeychainX={isHideKeychainX}
              isHideKeychainY={isHideKeychainY}
              keychainFilter={keychainFilter}
              onChange={attributes.update("keychains")}
              value={attributes.value.keychains}
            />
          </EditorLabel>
        )}
        {hasNameTag && (
          <EditorLabel
            isDisabled={isDisabled}
            label={translate("EditorNametag")}
          >
            <EditorInput
              className={clsx("w-full", isDisabled && "text-right")}
              disabled={isDisabled}
              maxLength={20}
              onChange={attributes.input("nameTag")}
              placeholder={
                isDisabled ? "N/A" : translate("EditorNametagPlaceholder")
              }
              validate={(nameTag) =>
                CS2Economy.safeValidateNametag(nameTag ?? "")
              }
              value={attributes.value.nameTag}
            />
          </EditorLabel>
        )}
        {hasSeed && (
          <EditorLabel isDisabled={isDisabled} label={translate("EditorSeed")}>
            <EditorStepRangeWithInput
              disabled={isDisabled}
              inputStyles="w-24 min-w-0"
              disabledInputStyles="flex-1 text-right"
              max={item.getMaximumSeed()}
              maxLength={String(item.getMaximumSeed()).length}
              min={minimumSeed}
              onChange={attributes.update("seed")}
              randomizable
              step={CS2_MIN_SEED}
              stepRangeStyles="flex-1"
              type="int"
              validate={(value) => CS2Economy.safeValidateSeed(value, item)}
              value={attributes.value.seed}
            />
          </EditorLabel>
        )}
        {hasWear && (
          <EditorLabel isDisabled={isDisabled} label={translate("EditorWear")}>
            <EditorStepRangeWithInput
              disabled={isDisabled}
              inputStyles="w-24 min-w-0"
              disabledInputStyles="flex-1 text-right"
              max={item.getMaximumWear()}
              maxLength={wearStringMaxLen}
              min={minimumWear}
              onChange={attributes.update("wear")}
              randomizable
              step={CS2_WEAR_FACTOR}
              stepRangeStyles="flex-1"
              transform={wearToString}
              type="float"
              validate={(value) => CS2Economy.safeValidateWear(value, item)}
              value={attributes.value.wear}
            />
          </EditorLabel>
        )}
        {hasStatTrak && (
          <EditorLabel
            isDisabled={isDisabled}
            label={translate("EditorStatTrak")}
          >
            <EditorToggle
              checkedLabel={translate("GenericYes")}
              uncheckedLabel={translate("GenericNo")}
              disabled={isDisabled}
              checked={attributes.value.statTrak}
              onChange={attributes.checkbox("statTrak")}
            />
          </EditorLabel>
        )}
        {hasQuantity && (
          <EditorLabel
            isDisabled={isDisabled}
            label={translate("EditorQuantity")}
          >
            <EditorStepRangeWithInput
              inputStyles="w-24 min-w-0"
              max={maxQuantity}
              maxLength={String(maxQuantity).length}
              min={1}
              onChange={attributes.update("quantity")}
              step={1}
              stepRangeStyles="flex-1"
              type="int"
              validate={(value) => value >= 1 && value <= maxQuantity}
              value={attributes.value.quantity}
            />
          </EditorLabel>
        )}
        <div className="flex justify-end">
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
