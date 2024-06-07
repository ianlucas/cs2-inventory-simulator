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
  CS2_MAX_SEED,
  CS2_MAX_WEAR,
  CS2_MIN_SEED,
  CS2_MIN_WEAR,
  CS2_WEAR_FACTOR
} from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { useState } from "react";
import { useCheckbox } from "~/components/hooks/use-checkbox";
import { useInput } from "~/components/hooks/use-input";
import {
  isItemCountable,
  seedStringMaxLen,
  wearStringMaxLen,
  wearToString
} from "~/utils/economy";
import { useInventory, useRules, useTranslate } from "./app-context";
import { EditorInput } from "./editor-input";
import { EditorStepRangeWithInput } from "./editor-step-range-with-input";
import { EditorToggle } from "./editor-toggle";
import { ItemEditorLabel } from "./item-editor-label";
import { ItemEditorName } from "./item-editor-name";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
import { StickerPicker } from "./sticker-picker";

export interface ItemEditorAttributes {
  nametag?: string;
  quantity: number;
  seed?: number;
  stattrak?: boolean;
  stickers?: CS2BaseInventoryItem["stickers"];
  wear?: number;
}

export function ItemEditor({
  attributes,
  defaultQuantity,
  dismissType,
  item,
  maxQuantity,
  onDismiss,
  onSubmit
}: {
  attributes?: {
    nametag?: string;
    seed?: number;
    stattrak?: number;
    stickers?: CS2BaseInventoryItem["stickers"];
    wear?: number;
  };
  defaultQuantity?: number;
  dismissType?: "cancel" | "reset";
  item: CS2EconomyItem;
  maxQuantity?: number;
  onDismiss: () => void;
  onSubmit: (props: ItemEditorAttributes) => void;
}) {
  const [inventory] = useInventory();
  const {
    craftAllowNametag,
    craftAllowSeed,
    craftAllowStatTrak,
    craftAllowStickers,
    craftAllowWear,
    craftHideType,
    editAllowNametag,
    editAllowSeed,
    editAllowStatTrak,
    editAllowStickers,
    editAllowWear,
    editHideType,
    inventoryMaxItems
  } = useRules();
  const translate = useTranslate();
  const [stattrak, setStattrak] = useCheckbox(
    attributes?.stattrak !== undefined ? attributes.stattrak >= 0 : false
  );
  const [wear, setWear] = useState(
    attributes?.wear ?? item.wearMin ?? CS2_MIN_WEAR
  );
  const [seed, setSeed] = useState(attributes?.seed ?? 1);
  const [nametag, setNametag] = useInput(attributes?.nametag ?? "");
  const [stickers, setStickers] = useState<
    NonNullable<CS2BaseInventoryItem["stickers"]>
  >(attributes?.stickers ?? {});
  const [quantity, setQuantity] = useState(defaultQuantity ?? 1);
  const isCrafting = attributes === undefined;
  const hasStickers =
    (isCrafting ? craftAllowStickers : editAllowStickers) &&
    item.hasStickers() &&
    (isCrafting
      ? !craftHideType.includes("sticker")
      : !editHideType.includes("sticker"));
  const hasStattrak =
    (isCrafting ? craftAllowStatTrak : editAllowStatTrak) && item.hasStatTrak();
  const hasSeed =
    (isCrafting ? craftAllowSeed : editAllowSeed) && item.hasSeed();
  const hasWear =
    (isCrafting ? craftAllowWear : editAllowWear) && item.hasWear();
  const hasNametag =
    (isCrafting ? craftAllowNametag : editAllowNametag) && item.hasNametag();
  const isWearValid = !hasWear || CS2Economy.safeValidateWear(wear);
  const isNametagValid =
    !hasNametag ||
    CS2Economy.safeValidateNametag(nametag) ||
    nametag.length === 0;
  const isSeedValid = !hasSeed || CS2Economy.safeValidateSeed(seed);
  const canCraft = isWearValid && isNametagValid && isSeedValid;
  const isDismissReset = dismissType === "reset";
  const hasQuantity = isItemCountable(item);

  maxQuantity ??= inventoryMaxItems - inventory.size();
  dismissType ??= "reset";

  function handleSubmit() {
    onSubmit({
      nametag: hasNametag && nametag.length > 0 ? nametag : undefined,
      quantity,
      seed:
        hasSeed && (!isCrafting || seed !== CS2_MIN_SEED) ? seed : undefined,
      stattrak: hasStattrak && stattrak === true ? stattrak : undefined,
      stickers,
      wear: hasWear && (!isCrafting || wear !== CS2_MIN_WEAR) ? wear : undefined
    });
  }

  return (
    <div className="m-auto w-[360px] select-none px-4 pb-6 lg:px-0">
      <ItemImage
        className="m-auto h-[192px] w-[256px]"
        item={item}
        wear={item.hasWear() ? wear : undefined}
      />
      <div
        className={clsx("mb-4 text-center", item.type === "agent" && "mt-4")}
      >
        <ItemEditorName item={item} />
      </div>
      <div className="space-y-4">
        {hasStickers && (
          <ItemEditorLabel direction="left" label={translate("EditorStickers")}>
            <StickerPicker
              isCrafting={isCrafting}
              value={stickers}
              onChange={setStickers}
            />
          </ItemEditorLabel>
        )}
        {hasNametag && (
          <ItemEditorLabel
            className="flex items-center gap-4"
            label={translate("EditorNametag")}
          >
            <EditorInput
              maxLength={20}
              onChange={setNametag}
              placeholder={translate("EditorNametagPlaceholder")}
              validate={(nametag) =>
                CS2Economy.safeValidateNametag(nametag ?? "")
              }
              value={nametag}
            />
          </ItemEditorLabel>
        )}
        {hasSeed && (
          <ItemEditorLabel
            className="flex select-none items-center gap-4"
            label={translate("EditorSeed")}
          >
            <EditorStepRangeWithInput
              inputStyles="w-[68px]"
              max={CS2_MAX_SEED}
              maxLength={seedStringMaxLen}
              min={CS2_MIN_SEED}
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
        {hasWear && (
          <ItemEditorLabel
            className="flex select-none items-center gap-4"
            label={translate("EditorWear")}
          >
            <EditorStepRangeWithInput
              inputStyles="w-[68px]"
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
        {hasStattrak && (
          <ItemEditorLabel
            className="flex select-none items-center gap-4"
            label={translate("EditorStatTrak")}
          >
            <EditorToggle checked={stattrak} onChange={setStattrak} />
          </ItemEditorLabel>
        )}
        {hasQuantity && (
          <ItemEditorLabel
            className="flex select-none items-center gap-4"
            label={translate("EditorQuantity")}
          >
            <EditorStepRangeWithInput
              inputStyles="w-[68px]"
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
          {isDismissReset && (
            <FontAwesomeIcon icon={faLongArrowLeft} className="mr-2 h-4" />
          )}
          {translate(isDismissReset ? "EditorReset" : "EditorCancel")}
        </ModalButton>
        <ModalButton
          children={translate(isCrafting ? "EditorCraft" : "EditorSave")}
          disabled={!canCraft}
          onClick={handleSubmit}
          variant="primary"
        />
      </div>
    </div>
  );
}
