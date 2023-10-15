/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { faBoxOpen, faMagnifyingGlass, faTrashCan, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CS_Economy, CS_Item } from "cslib";
import { useEffect, useState } from "react";
import { useInput } from "~/hooks/use-input";
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
  const [category, setCategory] = useState("");
  const [search, setSearch] = useInput("");
  const [activeIndex, setActiveIndex] = useState(null as number | null);
  const [filtered, setFiltered] = useState([] as CS_Item[]);
  const stickers = CS_Economy.getStickers();
  const categories = CS_Economy.getStickerCategories();

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

  useEffect(() => {
    const words = search.split(" ").map((word) => word.toLowerCase());
    setFiltered(
      stickers.filter((item) => {
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
      })
    );
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
                  />
                )
                : (
                  <div className="flex h-[64px] w-[85.33px] items-center justify-center text-neutral-700">
                    N/A
                  </div>
                )}
              <div className="absolute left-0 top-0 h-full w-full transition-all hover:shadow-[inset_0_0_0_3px_#fff]">
              </div>
            </button>
          );
        })}
      </div>
      {activeIndex !== null && (
        <Modal className="w-[640px] pb-1" portal>
          <div className="font-bold px-4 py-2 select-none flex justify-between">
            <label>Pick A Sticker</label>
            <button
              onClick={handleCloseModal}
              className="cursor-default text-white/50 hover:text-white"
            >
              <FontAwesomeIcon icon={faXmark} className="h-4" />
            </button>
          </div>
          <div className="mb-4 pl-4 pr-2 flex items-center gap-2">
            <div className="flex items-center flex-1 gap-2">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="h-4" />
              <EditorInput
                value={search}
                onChange={setSearch}
                placeholder={"Type a sticker name..."}
              />
            </div>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faBoxOpen} className="h-4" />
              <EditorSelect
                onChange={setCategory}
                options={categories}
                placeholder="Filter by category..."
                value={category}
              />
            </div>
            <button
              className="flex items-center gap-1 text-red-500 hover:bg-black/30 active:bg-black/60 transition px-2 h-[24px] rounded"
              onClick={handleRemoveSticker}
            >
              <FontAwesomeIcon icon={faTrashCan} />
              <label>Remove</label>
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

  const clickable = onClick !== undefined;

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
