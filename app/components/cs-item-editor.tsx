/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faBolt, faLongArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CS_hasNametag, CS_hasSeed, CS_hasStatTrak, CS_hasStickers, CS_hasWear, CS_Item, CS_MAX_SEED, CS_MAX_WEAR, CS_MIN_SEED, CS_MIN_WEAR, CS_NAMETAG_RE, CS_resolveItemImage, CS_safeValidateNametag, CS_safeValidateSeed, CS_safeValidateWear, CS_WEAR_FACTOR } from "@ianlucas/cslib";
import { useState } from "react";
import { useCheckbox } from "~/hooks/use-checkbox";
import { useInput } from "~/hooks/use-input";
import { useTranslation } from "~/hooks/use-translation";
import { baseUrl } from "~/utils/economy";
import { EditorInput } from "./editor-input";
import { EditorStepRange } from "./editor-step-range";
import { EditorToggle } from "./editor-toggle";
import { useRootContext } from "./root-context";
import { StickerPicker } from "./sticker-picker";

export interface CSItemEditorAttributes {
  nametag?: string;
  quantity: number;
  seed?: number;
  stattrak?: boolean;
  stickers?: (number | null)[];
  wear?: number;
}

export function CSItemEditor({
  csItem,
  onReset,
  onSubmit
}: {
  csItem: CS_Item;
  onReset(): void;
  onSubmit(props: CSItemEditorAttributes): void;
}) {
  const { maxInventoryItems, inventory } = useRootContext();
  const [stattrak, setStattrak] = useCheckbox(false);
  const [wear, setWear] = useState(CS_MIN_WEAR);
  const [seed, setSeed] = useState(1);
  const [nametag, setNametag] = useInput("");
  const [stickers, setStickers] = useState([null, null, null, null] as (
    | number
    | null
  )[]);
  const [quantity, setQuantity] = useState(1);
  const hasStickers = CS_hasStickers(csItem);
  const hasStattrak = CS_hasStatTrak(csItem);
  const hasSeed = CS_hasSeed(csItem);
  const hasWear = CS_hasWear(csItem);
  const hasNametag = CS_hasNametag(csItem);
  const isValid = CS_safeValidateWear(wear)
    && (CS_safeValidateNametag(nametag) || nametag.length === 0)
    && CS_safeValidateSeed(seed);
  const maxQuantity = maxInventoryItems - inventory.size();
  const hasQuantity = ["case", "key", "sticker", "tool"].includes(csItem.type);
  const translate = useTranslation();

  function handleSubmit() {
    onSubmit({
      nametag: hasNametag && nametag.length > 0 ? nametag : undefined,
      quantity,
      stickers: hasStickers
          && stickers.filter((sticker) => sticker !== null).length > 0
        ? stickers
        : undefined,
      seed: hasSeed && seed !== CS_MIN_SEED ? seed : undefined,
      wear: hasWear && wear !== CS_MIN_WEAR ? wear : undefined,
      stattrak: hasStattrak && stattrak === true ? stattrak : undefined
    });
  }

  return (
    <div className="w-[360px] m-auto pb-6 select-none px-4 lg:px-0">
      <img
        className="w-[256px] h-[192px] m-auto"
        src={CS_resolveItemImage(baseUrl, csItem.id, wear)}
        alt={csItem.name}
        draggable={false}
      />
      <div
        className="text-center font-bold mb-4"
        style={{ color: csItem.rarity }}
      >
        {csItem.name}
      </div>
      <div className="space-y-4">
        {hasStickers && (
          <div>
            <label className="font-bold text-neutral-500 w-[76.33px] select-none">
              {translate("EditorStickers")}
            </label>
            <StickerPicker value={stickers} onChange={setStickers} />
          </div>
        )}
        {hasNametag && (
          <div className="flex items-center gap-4">
            <label className="font-bold text-neutral-500 w-[76.33px] select-none">
              {translate("EditorNametag")}
            </label>
            <EditorInput
              value={nametag}
              placeholder={translate("EditorNametagPlaceholder")}
              onChange={setNametag}
              pattern={CS_NAMETAG_RE}
              maxLength={20}
            />
          </div>
        )}
        {hasSeed && (
          <div className="flex items-center gap-4 select-none">
            <label className="font-bold text-neutral-500 w-[76.33px]">
              {translate("EditorSeed")}
            </label>
            <span className="w-[68px]">{seed}</span>
            <EditorStepRange
              className="flex-1"
              value={seed}
              onChange={setSeed}
              max={CS_MAX_SEED}
              min={CS_MIN_SEED}
              step={CS_MIN_SEED}
            />
          </div>
        )}
        {hasWear && (
          <div className="flex items-center gap-4 select-none">
            <label className="font-bold text-neutral-500 w-[76.33px]">
              {translate("EditorWear")}
            </label>
            <span className="w-[68px]">
              {wear.toFixed(String(CS_WEAR_FACTOR).length - 2)}
            </span>
            <EditorStepRange
              className="flex-1"
              value={wear}
              onChange={setWear}
              max={csItem.wearmax ?? CS_MAX_WEAR}
              min={csItem.wearmin ?? CS_MIN_WEAR}
              step={CS_WEAR_FACTOR}
            />
          </div>
        )}
        {hasStattrak && (
          <div className="flex items-center gap-4 select-none">
            <label className="font-bold text-neutral-500 w-[76.33px]">
              {translate("EditorStatTrak")}
            </label>
            <EditorToggle
              checked={stattrak}
              onChange={setStattrak}
            />
          </div>
        )}
        {hasQuantity && (
          <div className="flex items-center gap-4 select-none">
            <label className="font-bold text-neutral-500 w-[76.33px]">
              {translate("EditorQuantity")}
            </label>
            <span className="w-[68px]">{quantity}</span>
            <EditorStepRange
              className="flex-1"
              value={quantity}
              onChange={setQuantity}
              max={maxQuantity}
              min={1}
              step={1}
            />
          </div>
        )}
      </div>
      <div className="flex justify-center mt-6 gap-2">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 rounded drop-shadow-lg cursor-default text-neutral-300 hover:text-neutral-100"
        >
          <FontAwesomeIcon
            icon={faLongArrowLeft}
            className="h-4"
          />
          {translate("EditorReset")}
        </button>
        <button
          disabled={!isValid}
          onClick={handleSubmit}
          className="flex items-center gap-2 bg-white/80 hover:bg-white text-neutral-700 px-4 py-2 rounded font-bold drop-shadow-lg transition disabled:bg-neutral-500 disabled:text-neutral-700 cursor-default"
        >
          <FontAwesomeIcon
            icon={faBolt}
            className="h-4"
          />
          {translate("EditorCraft")}
        </button>
      </div>
    </div>
  );
}
