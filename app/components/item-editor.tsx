/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faLongArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS2BaseInventoryItem,
  CS2Economy,
  CS2EconomyItem,
  CS2ItemType,
  CS2_MAX_WEAR,
  CS2_MIN_SEED,
  CS2_MIN_WEAR,
  CS2_WEAR_FACTOR
} from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { useState } from "react";
import { useCheckbox } from "~/components/hooks/use-checkbox";
import { useInput } from "~/components/hooks/use-input";
import { wearStringMaxLen, wearToString } from "~/utils/economy";
import { useLocalize } from "./app-context";
import { EditorInput } from "./editor-input";
import { EditorStepRangeWithInput } from "./editor-step-range-with-input";
import { EditorToggle } from "./editor-toggle";
import { useCraftableItem } from "./hooks/use-craftable-item";
import { ItemEditorLabel } from "./item-editor-label";
import { ItemEditorName } from "./item-editor-name";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
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

export function ItemEditor({
  attributes,
  defaultQuantity,
  disabled,
  item,
  maxQuantity,
  onDismiss,
  onSubmit,
  type
}: {
  attributes?: {
    nameTag?: string;
    patches?: CS2BaseInventoryItem["patches"];
    seed?: number;
    statTrak?: number;
    stickers?: CS2BaseInventoryItem["stickers"];
    wear?: number;
  };
  defaultQuantity?: number;
  disabled?: boolean;
  item: CS2EconomyItem;
  maxQuantity?: number;
  onDismiss: () => void;
  onSubmit: (props: ItemEditorAttributes) => void;
  type?: "craft" | "edit" | "share";
}) {
  type ??= "craft";

  const localize = useLocalize();
  const [statTrak, setStatTrak] = useCheckbox(
    attributes?.statTrak !== undefined
  );
  const [wear, setWear] = useState(attributes?.wear ?? item.getMinimumWear());
  const [seed, setSeed] = useState(attributes?.seed ?? CS2_MIN_SEED);
  const [nameTag, setNameTag] = useInput(attributes?.nameTag ?? "");
  const [stickers, setStickers] = useState<
    NonNullable<CS2BaseInventoryItem["stickers"]>
  >(attributes?.stickers ?? {});
  const [patches, setPatches] = useState<
    NonNullable<CS2BaseInventoryItem["patches"]>
  >(attributes?.patches ?? {});
  const [quantity, setQuantity] = useState(defaultQuantity ?? 1);

  const {
    craftable,
    hasNameTag,
    hasPatches,
    hasQuantity,
    hasSeed,
    hasStatTrak,
    hasStickers,
    hasWear,
    inventoryMaxQuantity,
    isCrafting,
    isSharing,
    showNameTag,
    showPatches,
    showSeed,
    showStatTrak,
    showStickers,
    showWear
  } = useCraftableItem({
    attributes: {
      nameTag,
      patches,
      seed,
      statTrak,
      stickers,
      wear
    },
    item,
    type
  });

  const dismissLabel = isCrafting
    ? "EditorReset"
    : isSharing
      ? "InspectClose"
      : "EditorCancel";

  maxQuantity =
    maxQuantity !== undefined
      ? Math.min(inventoryMaxQuantity, maxQuantity)
      : inventoryMaxQuantity;

  function handleSubmit() {
    onSubmit({
      patches:
        hasPatches && Object.keys(patches).length > 0 ? patches : undefined,
      nameTag: hasNameTag && nameTag.length > 0 ? nameTag : undefined,
      quantity,
      seed:
        hasSeed && (!isCrafting || seed !== item.getMinimumSeed())
          ? seed
          : undefined,
      statTrak: hasStatTrak && statTrak === true ? statTrak : undefined,
      stickers: hasStickers
        ? Object.keys(stickers).length > 0
          ? stickers
          : undefined
        : undefined,
      wear: hasWear && (!isCrafting || wear !== CS2_MIN_WEAR) ? wear : undefined
    });
  }

  return (
    <div className="m-auto w-[368px] select-none px-4 pb-6 lg:px-0">
      <ItemImage
        className="m-auto h-[192px] w-[256px]"
        item={item}
        wear={item.hasWear() ? wear : undefined}
      />
      <div
        className={clsx(
          "mb-4 text-center",
          item.type === CS2ItemType.Agent && "mt-4"
        )}
      >
        <ItemEditorName item={item} />
      </div>
      <div className="space-y-4">
        {showStickers && (
          <ItemEditorLabel direction="left" label={localize("EditorStickers")}>
            <StickerPicker
              disabled={disabled}
              isCrafting={isCrafting}
              value={stickers}
              onChange={setStickers}
            />
          </ItemEditorLabel>
        )}
        {showPatches && (
          <ItemEditorLabel direction="left" label={localize("EditorPatches")}>
            <PatchPicker
              disabled={disabled}
              isCrafting={isCrafting}
              value={patches}
              onChange={setPatches}
            />
          </ItemEditorLabel>
        )}
        {showNameTag && (
          <ItemEditorLabel
            className="flex items-center gap-4"
            label={localize("EditorNametag")}
          >
            <EditorInput
              disabled={disabled}
              maxLength={20}
              onChange={setNameTag}
              placeholder={
                disabled ? "N/A" : localize("EditorNametagPlaceholder")
              }
              validate={(nameTag) =>
                CS2Economy.safeValidateNametag(nameTag ?? "")
              }
              value={nameTag}
            />
          </ItemEditorLabel>
        )}
        {showSeed && (
          <ItemEditorLabel
            className="flex select-none items-center gap-4"
            label={localize("EditorSeed")}
          >
            <EditorStepRangeWithInput
              disabled={disabled}
              inputStyles="w-[74px]"
              max={item.getMaximumSeed()}
              maxLength={String(item.getMaximumSeed()).length}
              min={item.getMinimumSeed()}
              onChange={setSeed}
              randomizable
              step={CS2_MIN_SEED}
              stepRangeStyles="flex-1"
              type="int"
              validate={(value) => CS2Economy.safeValidateSeed(value, item)}
              value={seed}
            />
          </ItemEditorLabel>
        )}
        {showWear && (
          <ItemEditorLabel
            className="flex select-none items-center gap-4"
            label={localize("EditorWear")}
          >
            <EditorStepRangeWithInput
              disabled={disabled}
              inputStyles="w-[74px]"
              max={item.wearMax ?? CS2_MAX_WEAR}
              maxLength={wearStringMaxLen}
              min={item.wearMin ?? CS2_MIN_WEAR}
              onChange={setWear}
              randomizable
              step={CS2_WEAR_FACTOR}
              stepRangeStyles="flex-1"
              transform={wearToString}
              type="float"
              validate={(value) => CS2Economy.safeValidateWear(value, item)}
              value={wear}
            />
          </ItemEditorLabel>
        )}
        {showStatTrak && (
          <ItemEditorLabel
            className="flex select-none items-center gap-4"
            label={localize("EditorStatTrak")}
          >
            <EditorToggle
              disabled={disabled}
              checked={statTrak}
              onChange={setStatTrak}
            />
          </ItemEditorLabel>
        )}
        {hasQuantity && (
          <ItemEditorLabel
            className="flex select-none items-center gap-4"
            label={localize("EditorQuantity")}
          >
            <EditorStepRangeWithInput
              disabled={disabled}
              inputStyles="w-[74px]"
              max={maxQuantity}
              maxLength={String(maxQuantity).length}
              min={1}
              onChange={setQuantity}
              step={1}
              stepRangeStyles="flex-1"
              type="int"
              validate={(value) => value >= 1 && value <= maxQuantity}
              value={quantity}
            />
          </ItemEditorLabel>
        )}
      </div>
      <div className="mt-6 flex justify-center gap-2">
        <ModalButton variant="secondary" onClick={onDismiss}>
          {type === "craft" && (
            <FontAwesomeIcon icon={faLongArrowLeft} className="mr-2 h-4" />
          )}
          {localize(dismissLabel)}
        </ModalButton>
        {(!isSharing || craftable) && (
          <ModalButton
            children={localize(
              isCrafting || isSharing ? "EditorCraft" : "EditorSave"
            )}
            disabled={!craftable}
            onClick={handleSubmit}
            variant="primary"
          />
        )}
      </div>
    </div>
  );
}
