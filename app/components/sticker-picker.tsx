/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  faBoxOpen,
  faMagnifyingGlass,
  faTrashCan,
  faXmark
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS_Economy,
  CS_Item,
  CS_MAX_STICKER_WEAR,
  CS_MIN_STICKER_WEAR,
  CS_NONE,
  CS_STICKER_WEAR_FACTOR
} from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { useInput } from "~/components/hooks/use-input";
import {
  sortByName,
  stickerWearStringMaxLen,
  stickerWearToString
} from "~/utils/economy";
import { useRules, useTranslate } from "./app-context";
import { EditorInput } from "./editor-input";
import { EditorSelect } from "./editor-select";
import { EditorStepRangeWithInput } from "./editor-step-range-with-input";
import { ItemBrowser } from "./item-browser";
import { ItemImage } from "./item-image";
import { Modal } from "./modal";

export function StickerPicker({
  isCrafting,
  onChange,
  value
}: {
  isCrafting: boolean;
  onChange: (value: { ids: number[]; wears: number[] }) => void;
  value: {
    ids: number[];
    wears: number[];
  };
}) {
  const { craftHideId, craftHideCategory, editHideId, editHideCategory } =
    useRules();
  const translate = useTranslate();

  const [category, setCategory] = useState("");
  const [search, setSearch] = useInput("");
  const [activeIndex, setActiveIndex] = useState<number>();
  const stickers = useMemo(() => CS_Economy.getStickers().sort(sortByName), []);
  const categories = useMemo(() => CS_Economy.getStickerCategories(), []);
  const [wear, setWear] = useState(0);

  function handleClickSlot(index: number) {
    return function handleClickSlot() {
      setActiveIndex(index);
    };
  }

  function handleAddSticker(item: CS_Item) {
    onChange({
      ids: value.ids.map((other, index) =>
        index === activeIndex ? item.id : other
      ),
      wears: value.wears.map((other, index) =>
        index === activeIndex ? wear : other
      )
    });
    setActiveIndex(undefined);
  }

  function handleRemoveSticker() {
    onChange({
      ids: value.ids.map((other, index) =>
        index === activeIndex ? CS_NONE : other
      ),
      wears: value.wears.map((other, index) =>
        index === activeIndex ? CS_NONE : other
      )
    });
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
        {value.ids.map((sticker, index) => {
          const item =
            sticker !== CS_NONE ? CS_Economy.getById(sticker) : CS_NONE;
          return (
            <button
              key={index}
              className="relative overflow-hidden rounded-lg bg-black/50"
              onClick={handleClickSlot(index)}
            >
              {item !== CS_NONE ? (
                <ItemImage className="h-[64px] w-[85.33px]" item={item} />
              ) : (
                <div className="flex h-[64px] w-[85.33px] items-center justify-center text-neutral-700">
                  {translate("StickerPickerNA")}
                </div>
              )}
              <div className="absolute left-0 top-0 h-full w-full transition-all hover:shadow-[inset_0_0_0_3px_#fff]"></div>
            </button>
          );
        })}
      </div>
      <Modal className="w-[540px] pb-1" hidden={activeIndex === undefined} blur>
        <div className="flex select-none justify-between px-4 py-2 font-bold">
          <label className="text-sm text-neutral-400">
            {translate("StickerPickerHeader")}
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
              placeholder={translate("StickerPickerSearchPlaceholder")}
            />
          </div>
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faBoxOpen} className="h-4" />
            <EditorSelect
              className="w-[192px]"
              onChange={setCategory}
              options={categories}
              placeholder={translate("StickerPickerFilterPlaceholder")}
              value={category}
            />
          </div>
          <button
            className="flex h-[24px] cursor-default items-center gap-1 rounded px-2 text-red-500 transition hover:bg-black/30 active:bg-black/60"
            onClick={handleRemoveSticker}
          >
            <FontAwesomeIcon icon={faTrashCan} className="h-4" />
            <label>{translate("StickerPickerRemove")}</label>
          </button>
        </div>
        <div
          className={clsx(
            "m-auto w-[400px] select-none px-4 pb-6 lg:px-0",
            filtered.length === 0 && "invisible"
          )}
        >
          <div className="flex select-none items-center gap-4">
            <label className="w-[150px] font-bold text-neutral-500">
              {translate("EditorStickerWear")}
            </label>
            <EditorStepRangeWithInput
              inputStyles="w-[68px]"
              max={CS_MAX_STICKER_WEAR}
              maxLength={stickerWearStringMaxLen}
              min={CS_MIN_STICKER_WEAR}
              onChange={setWear}
              randomizable
              step={CS_STICKER_WEAR_FACTOR}
              stepRangeStyles="flex-1"
              transform={stickerWearToString}
              type="float"
              validate={(value) =>
                value >= CS_MIN_STICKER_WEAR && value <= CS_MAX_STICKER_WEAR
              }
              value={wear}
            />
          </div>
        </div>
        <ItemBrowser items={filtered} onClick={handleAddSticker} />
      </Modal>
    </>
  );
}
