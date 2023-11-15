/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faBoxOpen, faMagnifyingGlass, faTrashCan, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CS_Economy, CS_getStickerCategories, CS_getStickers, CS_Item } from "@ianlucas/cslib";
import { useMemo, useState } from "react";
import { useInput } from "~/hooks/use-input";
import { useTranslation } from "~/hooks/use-translation";
import { EditorInput } from "./editor-input";
import EditorSelect from "./editor-select";
import { GridList } from "./grid-list";
import { Modal } from "./modal";

export function StickerPicker({
  onChange,
  value
}: {
  onChange: (value: (number | null)[]) => void;
  value: (number | null)[];
}) {
  const translate = useTranslation();

  const [category, setCategory] = useState("");
  const [search, setSearch] = useInput("");
  const [activeIndex, setActiveIndex] = useState(null as number | null);
  const stickers = useMemo(() => CS_getStickers(), []);
  const categories = useMemo(() => CS_getStickerCategories(), []);

  function handleClickSlot(index: number) {
    return function handleClickSlot() {
      setActiveIndex(index);
    };
  }

  function handleAddSticker(item: CS_Item) {
    onChange(
      value.map((other, index) => (index === activeIndex ? item.id : other))
    );
    setActiveIndex(null);
  }

  function handleRemoveSticker() {
    onChange(
      value.map((other, index) => (index === activeIndex ? null : other))
    );
    setActiveIndex(null);
  }

  function handleCloseModal() {
    setActiveIndex(null);
  }

  const filtered = useMemo(() => {
    const words = search.split(" ").map((word) => word.toLowerCase());
    return stickers.filter((item) => {
      if (search.length === 0) {
        return item.category === category;
      }
      if (category !== "" && item.category !== category) {
        return false;
      }
      if (search.length < 1) {
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
        {value.map((sticker, index) => {
          const item = sticker !== null ? CS_Economy.getById(sticker) : null;
          return (
            <button
              key={index}
              className="relative overflow-hidden rounded-lg bg-black/50"
              onClick={handleClickSlot(index)}
            >
              {item !== null
                ? (
                  <img
                    draggable={true}
                    className="h-[64px] w-[85.33px]"
                    src={item.image}
                    alt={item.name}
                  />
                )
                : (
                  <div className="flex h-[64px] w-[85.33px] items-center justify-center text-neutral-700">
                    {translate("StickerPickerNA")}
                  </div>
                )}
              <div className="absolute left-0 top-0 h-full w-full transition-all hover:shadow-[inset_0_0_0_3px_#fff]">
              </div>
            </button>
          );
        })}
      </div>
      {activeIndex !== null && (
        <Modal className="w-[640px] pb-1">
          <div className="font-bold px-4 py-2 select-none flex justify-between">
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
          <div className="mb-4 px-2 lg:pl-4 lg:pr-2 flex lg:items-center flex-col lg:flex-row gap-2">
            <div className="flex items-center flex-1 gap-2">
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
                onChange={setCategory}
                options={categories}
                placeholder={translate("StickerPickerFilterPlaceholder")}
                value={category}
              />
            </div>
            <button
              className="flex items-center gap-1 text-red-500 hover:bg-black/30 active:bg-black/60 transition px-2 h-[24px] rounded cursor-default"
              onClick={handleRemoveSticker}
            >
              <FontAwesomeIcon icon={faTrashCan} className="h-4" />
              <label>{translate("StickerPickerRemove")}</label>
            </button>
          </div>
          <GridList itemHeight={64} maxItemsIntoView={6}>
            {filtered.map((item) => (
              <StickerItemButton
                item={item}
                key={item.id}
                onClick={handleAddSticker}
              />
            ))}
          </GridList>
        </Modal>
      )}
    </>
  );
}

export function StickerItemButton({
  item,
  onClick
}: {
  item: CS_Item;
  onClick?(item: CS_Item): void;
}) {
  function handleClick() {
    if (onClick) {
      onClick(item);
    }
  }

  return (
    <button
      onClick={handleClick}
      className="bg-opacity-50 transition-all hover:bg-black/20 active:bg-black/30 block h-[64px] w-full px-2 rounded"
    >
      <div className="flex items-center">
        <img
          key={item.image}
          draggable={false}
          className="h-[63px] w-[84px]"
          src={item.image}
          alt={item.name}
        />
        <span
          className="block overflow-hidden text-ellipsis whitespace-nowrap"
          style={{ color: item.rarity }}
        >
          {item.name}
        </span>
      </div>
    </button>
  );
}
