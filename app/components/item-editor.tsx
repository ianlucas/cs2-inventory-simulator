/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faLongArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS_Economy,
  CS_INVENTORY_STICKERS,
  CS_INVENTORY_STICKERS_WEAR,
  CS_Item,
  CS_MAX_SEED,
  CS_MAX_WEAR,
  CS_MIN_SEED,
  CS_MIN_WEAR,
  CS_NONE,
  CS_WEAR_FACTOR
} from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { useState } from "react";
import { useCheckbox } from "~/hooks/use-checkbox";
import { useInput } from "~/hooks/use-input";
import {
  isItemCountable,
  seedStringMaxLen,
  wearStringMaxLen,
  wearToString
} from "~/utils/economy";
import { useAppContext, useTranslate } from "./app-context";
import { EditorInput } from "./editor-input";
import { EditorStepRangeWithInput } from "./editor-step-range-with-input";
import { EditorToggle } from "./editor-toggle";
import { ItemEditorName } from "./item-editor-name";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
import { StickerPicker } from "./sticker-picker";

export interface ItemEditorAttributes {
  nametag?: string;
  quantity: number;
  seed?: number;
  stattrak?: boolean;
  stickers?: number[];
  stickerswear?: number[];
  wear?: number;
}

export function ItemEditor({
  attributes,
  item,
  onReset,
  onSubmit
}: {
  attributes?: {
    nametag?: string;
    seed?: number;
    stattrak?: number;
    stickers?: number[];
    stickerswear?: number[];
    wear?: number;
  };
  item: CS_Item;
  onReset: () => void;
  onSubmit: (props: ItemEditorAttributes) => void;
}) {
  const {
    rules: {
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
    },
    inventory
  } = useAppContext();
  const translate = useTranslate();
  const [stattrak, setStattrak] = useCheckbox(
    attributes?.stattrak !== undefined ? attributes.stattrak >= 0 : false
  );
  const [wear, setWear] = useState(
    attributes?.wear ?? item.wearmin ?? CS_MIN_WEAR
  );
  const [seed, setSeed] = useState(attributes?.seed ?? 1);
  const [nametag, setNametag] = useInput(attributes?.nametag ?? "");
  const [stickersAttributes, setStickersAttributes] = useState({
    ids: attributes?.stickers ?? [...CS_INVENTORY_STICKERS],
    wears: attributes?.stickerswear ?? [...CS_INVENTORY_STICKERS_WEAR]
  });
  const [quantity, setQuantity] = useState(1);
  const isCrafting = attributes === undefined;
  const hasStickers =
    (isCrafting ? craftAllowStickers : editAllowStickers) &&
    CS_Economy.hasStickers(item) &&
    (isCrafting
      ? !craftHideType.includes("sticker")
      : !editHideType.includes("sticker"));
  const hasStattrak =
    (isCrafting ? craftAllowStatTrak : editAllowStatTrak) &&
    CS_Economy.hasStatTrak(item);
  const hasSeed =
    (isCrafting ? craftAllowSeed : editAllowSeed) && CS_Economy.hasSeed(item);
  const hasWear =
    (isCrafting ? craftAllowWear : editAllowWear) && CS_Economy.hasWear(item);
  const hasNametag =
    (isCrafting ? craftAllowNametag : editAllowNametag) &&
    CS_Economy.hasNametag(item);
  const isWearValid = !hasWear || CS_Economy.safeValidateWear(wear);
  const isNametagValid =
    !hasNametag ||
    CS_Economy.safeValidateNametag(nametag) ||
    nametag.length === 0;
  const isSeedValid = !hasSeed || CS_Economy.safeValidateSeed(seed);
  const canCraft = isWearValid && isNametagValid && isSeedValid;
  const maxQuantity = inventoryMaxItems - inventory.size();
  const hasQuantity = isItemCountable(item);

  function handleSubmit() {
    const stickers =
      hasStickers &&
      stickersAttributes.ids.filter((sticker) => sticker !== CS_NONE).length > 0
        ? stickersAttributes.ids
        : undefined;

    const stickerswear =
      hasStickers &&
      stickersAttributes.wears.filter((wear) => wear !== CS_NONE).length > 0
        ? stickersAttributes.wears
        : undefined;

    onSubmit({
      nametag: hasNametag && nametag.length > 0 ? nametag : undefined,
      quantity,
      seed: hasSeed && (!isCrafting || seed !== CS_MIN_SEED) ? seed : undefined,
      stattrak: hasStattrak && stattrak === true ? stattrak : undefined,
      stickers,
      stickerswear,
      wear: hasWear && (!isCrafting || wear !== CS_MIN_WEAR) ? wear : undefined
    });
  }

  return (
    <div className="m-auto w-[360px] select-none px-4 pb-6 lg:px-0">
      <ItemImage
        className="m-auto h-[192px] w-[256px]"
        item={item}
        wear={CS_Economy.hasWear(item) ? wear : undefined}
      />
      <div
        className={clsx("mb-4 text-center", item.type === "agent" && "mt-4")}
      >
        <ItemEditorName item={item} />
      </div>
      <div className="space-y-4">
        {hasStickers && (
          <div>
            <label className="w-[76.33px] select-none font-bold text-neutral-500">
              {translate("EditorStickers")}
            </label>
            <StickerPicker
              isCrafting={isCrafting}
              value={stickersAttributes}
              onChange={setStickersAttributes}
            />
          </div>
        )}
        {hasNametag && (
          <div className="flex items-center gap-4">
            <label className="w-[76.33px] select-none font-bold text-neutral-500">
              {translate("EditorNametag")}
            </label>
            <EditorInput
              maxLength={20}
              onChange={setNametag}
              placeholder={translate("EditorNametagPlaceholder")}
              validate={(nametag) =>
                CS_Economy.safeValidateNametag(nametag ?? "")
              }
              value={nametag}
            />
          </div>
        )}
        {hasSeed && (
          <div className="flex select-none items-center gap-4">
            <label className="w-[76.33px] font-bold text-neutral-500">
              {translate("EditorSeed")}
            </label>
            <EditorStepRangeWithInput
              inputStyles="w-[68px]"
              max={CS_MAX_SEED}
              maxLength={seedStringMaxLen}
              min={CS_MIN_SEED}
              onChange={setSeed}
              randomizable
              step={CS_MIN_SEED}
              stepRangeStyles="flex-1"
              type="int"
              validate={(value) => CS_Economy.safeValidateSeed(value, item)}
              value={seed}
            />
          </div>
        )}
        {hasWear && (
          <div className="flex select-none items-center gap-4">
            <label className="w-[76.33px] font-bold text-neutral-500">
              {translate("EditorWear")}
            </label>
            <EditorStepRangeWithInput
              inputStyles="w-[68px]"
              max={item.wearmax ?? CS_MAX_WEAR}
              maxLength={wearStringMaxLen}
              min={item.wearmin ?? CS_MIN_WEAR}
              onChange={setWear}
              randomizable
              step={CS_WEAR_FACTOR}
              stepRangeStyles="flex-1"
              transform={wearToString}
              type="float"
              validate={(value) => CS_Economy.safeValidateWear(value, item)}
              value={wear}
            />
          </div>
        )}
        {hasStattrak && (
          <div className="flex select-none items-center gap-4">
            <label className="w-[76.33px] font-bold text-neutral-500">
              {translate("EditorStatTrak")}
            </label>
            <EditorToggle checked={stattrak} onChange={setStattrak} />
          </div>
        )}
        {hasQuantity && (
          <div className="flex select-none items-center gap-4">
            <label className="w-[76.33px] font-bold text-neutral-500">
              {translate("EditorQuantity")}
            </label>
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
          </div>
        )}
      </div>
      <div className="mt-6 flex justify-center gap-2">
        <ModalButton variant="secondary" onClick={onReset}>
          {isCrafting && (
            <FontAwesomeIcon icon={faLongArrowLeft} className="mr-2 h-4" />
          )}
          {translate(isCrafting ? "EditorReset" : "EditorCancel")}
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
