/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

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
import { useLocalize } from "./app-context";
import { EditorInput } from "./editor-input";
import { EditorItemDisplay } from "./editor-item-display";
import { EditorLabel } from "./editor-label";
import { EditorStepRangeWithInput } from "./editor-step-range-with-input";
import { EditorToggle } from "./editor-toggle";
import { useKeyValue } from "./hooks/use-data";
import { PatchPicker } from "./patch-picker";
import { StickerPicker } from "./sticker-picker";

export interface ItemEditorAttributes {
  nameTag?: string;
  patches?: CS2BaseInventoryItem["patches"];
  quantity: number;
  seed?: number;
  statTrak?: boolean;
  stickers?: CS2BaseInventoryItem["stickers"];
  wear?: number;
}

export function ItemEditorV2({
  className,
  isDisabled,
  isHideNameTag,
  isHidePatches,
  isHideSeed,
  isHideStatTrak,
  isHideStickers,
  isHideWear,
  item,
  maxQuantity,
  onChange,
  patchFilter,
  stickerFilter
}: {
  className?: string;
  item: CS2InventoryItem | CS2EconomyItem;
  maxQuantity?: number;
  isDisabled?: boolean;
  isHideNameTag?: boolean;
  isHideSeed?: boolean;
  isHideWear?: boolean;
  isHideStatTrak?: boolean;
  isHideStickers?: boolean;
  isHidePatches?: boolean;
  onChange?: (data: ItemEditorAttributes) => void;
  stickerFilter?: (item: CS2EconomyItem) => boolean;
  patchFilter?: (item: CS2EconomyItem) => boolean;
}) {
  maxQuantity ??= 0;

  const defaults = item instanceof CS2InventoryItem ? item.asBase() : undefined;

  const hasQuantity = !isDisabled && isItemCountable(item);
  const hasStickers = !isHideStickers && item.hasStickers();
  const hasPatches = !isHidePatches && item.hasPatches();
  const hasNameTag = !isHideNameTag && item.hasNametag();
  const hasSeed = !isHideSeed && item.hasSeed();
  const hasWear = !isHideWear && item.hasWear();
  const hasStatTrak = !isHideStatTrak && item.hasStatTrak();
  const minimumSeed = item.getMinimumSeed();
  const minimumWear = item.getMinimumWear();

  const localize = useLocalize();

  const [data, onData] = useKeyValue({
    nameTag: defaults?.nameTag ?? "",
    patches: defaults?.patches ?? {},
    quantity: 1,
    seed: defaults?.seed ?? minimumSeed,
    statTrak: defaults?.statTrak !== undefined,
    stickers: defaults?.stickers ?? {},
    wear: defaults?.wear ?? minimumWear
  });

  useEffect(() => {
    onChange?.({
      nameTag: hasNameTag
        ? data.nameTag.length > 0
          ? data.nameTag
          : undefined
        : undefined,
      patches: hasPatches && hasKeys(data.patches) ? data.patches : undefined,
      quantity: data.quantity,
      seed: hasSeed
        ? data.seed !== CS2_MIN_SEED
          ? data.seed
          : undefined
        : undefined,
      statTrak: hasStatTrak && data.statTrak ? data.statTrak : undefined,
      stickers:
        hasStickers && hasKeys(data.stickers) ? data.stickers : undefined,
      wear: hasWear
        ? data.wear !== CS2_MIN_WEAR
          ? data.wear
          : undefined
        : undefined
    });
  }, [data]);

  return (
    <div className={clsx("m-auto select-none", className)}>
      <EditorItemDisplay item={item} wear={data.wear} />
      <div className="space-y-1.5">
        {hasStickers && (
          <EditorLabel block label={localize("EditorStickers")}>
            <StickerPicker
              stickerFilter={stickerFilter}
              disabled={isDisabled}
              value={data.stickers}
              onChange={onData.update("stickers")}
            />
          </EditorLabel>
        )}
        {hasPatches && (
          <EditorLabel block label={localize("EditorPatches")}>
            <PatchPicker
              patchFilter={patchFilter}
              disabled={isDisabled}
              value={data.patches}
              onChange={onData.update("patches")}
            />
          </EditorLabel>
        )}
        {hasNameTag && (
          <EditorLabel
            isDisabled={isDisabled}
            label={localize("EditorNametag")}
          >
            <EditorInput
              className={clsx("w-full", isDisabled && "text-right")}
              disabled={isDisabled}
              maxLength={20}
              onChange={onData.input("nameTag")}
              placeholder={
                isDisabled ? "N/A" : localize("EditorNametagPlaceholder")
              }
              validate={(nameTag) =>
                CS2Economy.safeValidateNametag(nameTag ?? "")
              }
              value={data.nameTag}
            />
          </EditorLabel>
        )}
        {hasSeed && (
          <EditorLabel isDisabled={isDisabled} label={localize("EditorSeed")}>
            <EditorStepRangeWithInput
              disabled={isDisabled}
              inputStyles="w-24 min-w-0"
              disabledInputStyles="flex-1 text-right"
              max={item.getMaximumSeed()}
              maxLength={String(item.getMaximumSeed()).length}
              min={minimumSeed}
              onChange={onData.update("seed")}
              randomizable
              step={CS2_MIN_SEED}
              stepRangeStyles="flex-1"
              type="int"
              validate={(value) => CS2Economy.safeValidateSeed(value, item)}
              value={data.seed}
            />
          </EditorLabel>
        )}
        {hasWear && (
          <EditorLabel isDisabled={isDisabled} label={localize("EditorWear")}>
            <EditorStepRangeWithInput
              disabled={isDisabled}
              inputStyles="w-24 min-w-0"
              disabledInputStyles="flex-1 text-right"
              max={item.getMaximumWear()}
              maxLength={wearStringMaxLen}
              min={minimumWear}
              onChange={onData.update("wear")}
              randomizable
              step={CS2_WEAR_FACTOR}
              stepRangeStyles="flex-1"
              transform={wearToString}
              type="float"
              validate={(value) => CS2Economy.safeValidateWear(value, item)}
              value={data.wear}
            />
          </EditorLabel>
        )}
        {hasStatTrak && (
          <EditorLabel
            isDisabled={isDisabled}
            label={localize("EditorStatTrak")}
          >
            <EditorToggle
              checkedLabel="Sim"
              uncheckedLabel="Não"
              disabled={isDisabled}
              checked={data.statTrak}
              onChange={onData.checkbox("statTrak")}
            />
          </EditorLabel>
        )}
        {hasQuantity && (
          <EditorLabel
            isDisabled={isDisabled}
            label={localize("EditorQuantity")}
          >
            <EditorStepRangeWithInput
              inputStyles="w-24 min-w-0"
              max={maxQuantity}
              maxLength={String(maxQuantity).length}
              min={1}
              onChange={onData.update("quantity")}
              step={1}
              stepRangeStyles="flex-1"
              type="int"
              validate={(value) => value >= 1 && value <= maxQuantity}
              value={data.quantity}
            />
          </EditorLabel>
        )}
      </div>
    </div>
  );
}
