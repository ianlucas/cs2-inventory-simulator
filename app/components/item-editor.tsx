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
import { useMeasure } from "@uidotdev/usehooks";
import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";
import { VIEWER_INSPECT_KINDS } from "~/viewer";
import {
  isItemCountable,
  PetStageLabel,
  wearStringMaxLen,
  wearToString
} from "~/shared/economy";
import { hasKeys } from "~/shared/misc";
import { useTranslate } from "./app-context";
import { ButtonWithTooltip } from "./button-with-tooltip";
import { EditorInput } from "./editor-input";
import { EditorItemDisplay } from "./editor-item-display";
import { EditorLabel } from "./editor-label";
import { EditorSelect } from "./editor-select";
import { EditorStepRangeWithInput } from "./editor-step-range-with-input";
import { EditorToggle } from "./editor-toggle";
import { useIsDesktop } from "./hooks/use-is-desktop";
import { useKeyValues } from "./hooks/use-key-values";
import { useViewerAvailability } from "./hooks/use-viewer-availability";
import { Keychain3dPicker } from "./keychain-3d-picker";
import { KeychainPicker } from "./keychain-picker";
import { confirm } from "./modal-generic";
import { Patch3dPicker } from "./patch-3d-picker";
import { PatchPicker } from "./patch-picker";
import { Sticker3dPicker } from "./sticker-3d-picker";
import { StickerPicker } from "./sticker-picker";

export interface ItemEditorAttributes {
  keychains?: CS2BaseInventoryItem["keychains"];
  nameTag?: string;
  patches?: CS2BaseInventoryItem["patches"];
  quantity: number;
  seed?: number;
  statTrak?: boolean;
  stickers?: CS2BaseInventoryItem["stickers"];
  style?: number;
  upgradeLevel?: number;
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
  isHideKeychainZ,
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
  isHideStyle,
  isHideUpgradeLevel,
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
  isHideKeychainZ?: boolean;
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
  isHideStyle?: boolean;
  isHideUpgradeLevel?: boolean;
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
  const hasNameTag = !isHideNameTag && item.hasNameTag();
  const hasSeed = !isHideSeed && item.hasSeed();
  const hasWear = !isHideWear && item.hasWear();
  const hasStatTrak = !isHideStatTrak && item.hasStatTrak();
  const hasStyle = !isHideStyle && item.hasStyle();
  const hasUpgradeLevel =
    !isHideUpgradeLevel && item.getUpgradeLevels().length > 1;
  const defaultUpgradeLevel = item.getDefaultUpgradeLevel();
  const minimumSeed = item.getMinimumSeed();
  const minimumWear = item.getMinimumWear();

  const translate = useTranslate();
  const isDesktop = useIsDesktop();
  const { canUse3d, isIdSupported } = useViewerAvailability(item, {
    attachment: true,
    kinds: VIEWER_INSPECT_KINDS
  });

  const use3dStickerPicker =
    canUse3d &&
    !isDisabled &&
    !isHideStickerRotation &&
    !isHideStickerSchema &&
    !isHideStickerWear &&
    !isHideStickerX &&
    !isHideStickerY;

  const use3dKeychainPicker =
    canUse3d &&
    !isDisabled &&
    !isHideKeychainSeed &&
    !isHideKeychainX &&
    !isHideKeychainY &&
    !isHideKeychainZ;

  const use3dPatchPicker = canUse3d && !isDisabled;

  const sticker3dFilter = useCallback(
    (economyItem: CS2EconomyItem) =>
      isIdSupported(economyItem.id) &&
      (stickerFilter === undefined || stickerFilter(economyItem)),
    [isIdSupported, stickerFilter]
  );

  const keychain3dFilter = useCallback(
    (economyItem: CS2EconomyItem) =>
      isIdSupported(economyItem.id) &&
      (keychainFilter === undefined || keychainFilter(economyItem)),
    [isIdSupported, keychainFilter]
  );

  const patch3dFilter = useCallback(
    (economyItem: CS2EconomyItem) =>
      isIdSupported(economyItem.id) &&
      (patchFilter === undefined || patchFilter(economyItem)),
    [isIdSupported, patchFilter]
  );

  const [attributesRef, { height: attributesHeight }] = useMeasure();
  const [isTallEditor, setIsTallEditor] = useState(false);
  useEffect(() => {
    if ((attributesHeight ?? 0) > 250) {
      setIsTallEditor(true);
    }
  }, [attributesHeight]);
  const isTwoColumn = isDesktop && isTallEditor;

  const attributes = useKeyValues({
    keychains: defaults?.keychains ?? {},
    nameTag: defaults?.nameTag ?? "",
    patches: defaults?.patches ?? {},
    quantity: defaultQuantity ?? 1,
    seed: defaults?.seed ?? minimumSeed,
    statTrak: defaults?.statTrak !== undefined,
    stickers: defaults?.stickers ?? {},
    style: defaults?.style,
    upgradeLevel: defaults?.upgradeLevel ?? defaultUpgradeLevel,
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
      style: hasStyle ? attributes.value.style : undefined,
      upgradeLevel:
        hasUpgradeLevel && attributes.value.upgradeLevel !== defaultUpgradeLevel
          ? attributes.value.upgradeLevel
          : undefined,
      wear: hasWear
        ? attributes.value.wear !== CS2_MIN_WEAR
          ? attributes.value.wear
          : undefined
        : undefined
    });
  }, [attributes.value]);

  const display = (
    <EditorItemDisplay
      item={item}
      keychains={attributes.value.keychains}
      nameTag={attributes.value.nameTag || undefined}
      seed={attributes.value.seed}
      statTrak={
        attributes.value.statTrak ? (defaults?.statTrak ?? 0) : undefined
      }
      stickers={attributes.value.stickers}
      style={attributes.value.style}
      upgradeLevel={attributes.value.upgradeLevel}
      wear={attributes.value.wear}
    />
  );

  const editor = (
    <div ref={attributesRef} className="space-y-1.5">
      {hasStickers && (
        <EditorLabel block label={translate("EditorStickers")}>
          {use3dStickerPicker ? (
            <Sticker3dPicker
              disabled={isDisabled}
              forItem={item}
              keychains={
                hasKeys(attributes.value.keychains)
                  ? attributes.value.keychains
                  : undefined
              }
              nameTag={attributes.value.nameTag || undefined}
              onChange={attributes.update("stickers")}
              seed={attributes.value.seed}
              statTrak={
                attributes.value.statTrak
                  ? (defaults?.statTrak ?? 0)
                  : undefined
              }
              stickerFilter={sticker3dFilter}
              value={attributes.value.stickers}
              wear={attributes.value.wear}
            />
          ) : (
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
          )}
        </EditorLabel>
      )}
      {hasPatches && (
        <EditorLabel block label={translate("EditorPatches")}>
          {use3dPatchPicker ? (
            <Patch3dPicker
              disabled={isDisabled}
              forItem={item}
              onChange={attributes.update("patches")}
              patchFilter={patch3dFilter}
              value={attributes.value.patches}
            />
          ) : (
            <PatchPicker
              patchFilter={patchFilter}
              disabled={isDisabled}
              value={attributes.value.patches}
              onChange={attributes.update("patches")}
            />
          )}
        </EditorLabel>
      )}
      {hasKeychains && (
        <EditorLabel block label={translate("EditorKeychains")}>
          {use3dKeychainPicker ? (
            <Keychain3dPicker
              disabled={isDisabled}
              forItem={item}
              keychainFilter={keychain3dFilter}
              nameTag={attributes.value.nameTag || undefined}
              onChange={attributes.update("keychains")}
              seed={attributes.value.seed}
              statTrak={
                attributes.value.statTrak
                  ? (defaults?.statTrak ?? 0)
                  : undefined
              }
              stickers={
                hasKeys(attributes.value.stickers)
                  ? attributes.value.stickers
                  : undefined
              }
              value={attributes.value.keychains}
              wear={attributes.value.wear}
            />
          ) : (
            <KeychainPicker
              disabled={isDisabled}
              forItem={item}
              isHideKeychainSeed={isHideKeychainSeed}
              isHideKeychainX={isHideKeychainX}
              isHideKeychainY={isHideKeychainY}
              isHideKeychainZ={isHideKeychainZ}
              keychainFilter={keychainFilter}
              onChange={attributes.update("keychains")}
              value={attributes.value.keychains}
            />
          )}
        </EditorLabel>
      )}
      {hasNameTag && (
        <EditorLabel isDisabled={isDisabled} label={translate("EditorNametag")}>
          <EditorInput
            className={clsx("w-full", isDisabled && "text-right")}
            disabled={isDisabled}
            maxCodePoints={20}
            onChange={attributes.input("nameTag")}
            placeholder={
              isDisabled ? "N/A" : translate("EditorNametagPlaceholder")
            }
            validate={(nameTag) =>
              CS2Economy.safeValidateNameTag(nameTag ?? "")
            }
            value={attributes.value.nameTag}
          />
        </EditorLabel>
      )}
      {hasSeed && (
        <EditorLabel isDisabled={isDisabled} label={translate("EditorPattern")}>
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
      {hasStyle && (
        <EditorLabel isDisabled={isDisabled} label={translate("EditorStyle")}>
          <EditorStepRangeWithInput
            disabled={isDisabled}
            disabledInputStyles="flex-1 text-right"
            emptyValue={0}
            inputStyles="w-24 min-w-0"
            max={item.getStyleCount()}
            maxLength={String(item.getStyleCount()).length}
            min={0}
            onChange={(value) =>
              attributes.update("style")(value === 0 ? undefined : value)
            }
            placeholder={translate("PetStyleDefault")}
            step={1}
            stepRangeStyles="flex-1"
            type="int"
            validate={(value) => CS2Economy.safeValidateStyle(value, item)}
            value={attributes.value.style ?? 0}
          />
        </EditorLabel>
      )}
      {hasUpgradeLevel && (
        <EditorLabel isDisabled={isDisabled} label={translate("EditorStage")}>
          <EditorSelect
            className="h-7 flex-1 bg-neutral-950/40 px-1 outline-hidden focus:ring-2 focus:ring-blue-500/50 disabled:bg-transparent disabled:text-right"
            disabled={isDisabled}
            onChange={(value) =>
              attributes.update("upgradeLevel")(Number(value))
            }
            options={item.getUpgradeLevels().map((upgradeLevel) => ({
              label: translate(`PetStage${PetStageLabel[upgradeLevel]}`),
              value: String(upgradeLevel)
            }))}
            styleless
            value={String(attributes.value.upgradeLevel)}
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
  );

  return (
    <div
      className={clsx(
        "m-auto mt-4 text-sm select-none",
        isTwoColumn ? "w-160" : "w-105",
        className
      )}
    >
      {isTwoColumn ? (
        <div className="flex items-center gap-4">
          <div className="shrink-0">{display}</div>
          <div className="min-w-0 flex-1">{editor}</div>
        </div>
      ) : (
        <>
          {display}
          {editor}
        </>
      )}
    </div>
  );
}
