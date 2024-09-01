/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  faMagnifyingGlass,
  faTag,
  faTrashCan,
  faXmark
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS2BaseInventoryItem,
  CS2Economy,
  CS2EconomyItem,
  CS2_MAX_STICKER_WEAR,
  CS2_MIN_STICKER_WEAR,
  CS2_STICKER_WEAR_FACTOR,
  ensure
} from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { useInput } from "~/components/hooks/use-input";
import {
  sortByName,
  stickerWearStringMaxLen,
  stickerWearToString
} from "~/utils/economy";
import { range } from "~/utils/number";
import { useLocalize, useRules } from "./app-context";
import { EditorInput } from "./editor-input";
import { EditorSelect } from "./editor-select";
import { EditorStepRangeWithInput } from "./editor-step-range-with-input";
import { ItemBrowser } from "./item-browser";
import { ItemEditorLabel } from "./item-editor-label";
import { ItemImage } from "./item-image";
import { Modal } from "./modal";

export function StickerPicker({
  disabled,
  isCrafting,
  onChange,
  value
}: {
  disabled?: boolean;
  isCrafting: boolean;
  onChange: (value: NonNullable<CS2BaseInventoryItem["stickers"]>) => void;
  value: NonNullable<CS2BaseInventoryItem["stickers"]>;
}) {
  const { craftHideId, craftHideCategory, editHideId, editHideCategory } =
    useRules();
  const localize = useLocalize();

  const [category, setCategory] = useState("");
  const [search, setSearch] = useInput("");
  const [activeIndex, setActiveIndex] = useState<number>();
  const stickers = useMemo(() => CS2Economy.getStickers().sort(sortByName), []);
  const categories = useMemo(() => CS2Economy.getStickerCategories(), []);
  const [wear, setWear] = useState(0);

  function handleClickSlot(index: number) {
    return function handleClickSlot() {
      setActiveIndex(index);
    };
  }

  function handleAddSticker(item: CS2EconomyItem) {
    onChange({
      ...value,
      [ensure(activeIndex)]: {
        id: item.id,
        wear
      }
    });
    setActiveIndex(undefined);
  }

  function handleRemoveSticker() {
    const updated = { ...value };
    delete updated[ensure(activeIndex)];
    onChange(updated);
    setActiveIndex(undefined);
  }

  function handleCloseModal() {
    setActiveIndex(undefined);
  }

  const filtered = useMemo(() => {
    const words = search.split(" ").map((word) => word.toLowerCase());
    return stickers.filter((item) => {
      if (isCrafting && craftHideId.includes(item.id)) {
        return false;
      }
      if (
        isCrafting &&
        item.category !== undefined &&
        craftHideCategory.includes(item.category)
      ) {
        return false;
      }
      if (!isCrafting && editHideId.includes(item.id)) {
        return false;
      }
      if (
        !isCrafting &&
        item.category !== undefined &&
        editHideCategory.includes(item.category)
      ) {
        return false;
      }
      if (category !== "" && item.category !== category) {
        return false;
      }
      const name = item.name.toLowerCase();
      for (const word of words) {
        if (word.length > 0 && name.indexOf(word) === -1) {
          return false;
        }
      }
      return true;
    });
  }, [search, category]);

  return (
    <>
      <div className="flex justify-between">
        {range(4).map((index) => {
          const sticker = value[index];
          const stickerWear = sticker?.wear ?? CS2_MIN_STICKER_WEAR;
          const item =
            sticker !== undefined ? CS2Economy.getById(sticker.id) : undefined;
          return (
            <button
              disabled={disabled}
              key={index}
              className="relative overflow-hidden rounded bg-black/50"
              onClick={handleClickSlot(index)}
            >
              {item !== undefined ? (
                <ItemImage className="h-[64px] w-[85.33px]" item={item} />
              ) : (
                <div className="flex h-[64px] w-[85.33px] items-center justify-center font-display font-bold text-neutral-700">
                  {localize("StickerPickerNA")}
                </div>
              )}
              {sticker !== undefined && (
                <div className="text-outline-1 absolute bottom-0 right-1 font-display font-bold drop-shadow-lg">
                  {(stickerWear * 100).toFixed(0)}%
                </div>
              )}
              {!disabled && (
                <div className="absolute left-0 top-0 h-full w-full rounded border-[3px] border-transparent transition-all hover:border-white" />
              )}
            </button>
          );
        })}
      </div>
      <Modal className="w-[540px] pb-1" hidden={activeIndex === undefined} blur>
        <div className="flex select-none justify-between px-4 py-2 font-bold">
          <label className="text-sm text-neutral-400">
            {localize("StickerPickerHeader")}
          </label>
          <button
            onClick={handleCloseModal}
            className="cursor-default text-white/50 hover:text-white"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4" />
          </button>
        </div>
        <div className="mb-4 flex flex-col gap-2 px-2 lg:flex-row lg:items-center lg:pl-4 lg:pr-2">
          <div className="flex flex-1 items-center gap-2">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="h-4" />
            <EditorInput
              value={search}
              onChange={setSearch}
              placeholder={localize("StickerPickerSearchPlaceholder")}
            />
          </div>
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faTag} className="h-4" />
            <EditorSelect
              className="w-[192px]"
              onChange={setCategory}
              options={categories}
              placeholder={localize("StickerPickerFilterPlaceholder")}
              value={category}
            />
          </div>
          <button
            className="flex h-[24px] cursor-default items-center gap-1 rounded px-2 text-red-500 transition hover:bg-black/30 active:bg-black/60"
            onClick={handleRemoveSticker}
            title={localize("StickerPickerRemove")}
          >
            <FontAwesomeIcon icon={faTrashCan} className="h-4" />
          </button>
        </div>
        <div
          className={clsx(
            "m-auto w-[460px] select-none px-4 pb-4 lg:px-0",
            filtered.length === 0 && "invisible"
          )}
        >
          <ItemEditorLabel
            className="flex select-none items-center gap-4"
            label={localize("EditorStickerWear")}
            labelStyles="w-[136px]"
          >
            <EditorStepRangeWithInput
              inputStyles="w-[26px]"
              max={CS2_MAX_STICKER_WEAR}
              maxLength={stickerWearStringMaxLen}
              min={CS2_MIN_STICKER_WEAR}
              onChange={setWear}
              randomizable
              step={CS2_STICKER_WEAR_FACTOR}
              stepRangeStyles="flex-1"
              transform={stickerWearToString}
              type="float"
              validate={(value) =>
                value >= CS2_MIN_STICKER_WEAR && value <= CS2_MAX_STICKER_WEAR
              }
              value={wear}
            />
          </ItemEditorLabel>
        </div>
        <ItemBrowser items={filtered} onClick={handleAddSticker} />
      </Modal>
    </>
  );
}
