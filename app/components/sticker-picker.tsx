/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2BaseInventoryItem,
  CS2Economy,
  CS2EconomyItem,
  CS2_MIN_STICKER_WEAR,
  ensure
} from "@ianlucas/cs2-lib";
import { useMemo, useState } from "react";
import { useInput } from "~/components/hooks/use-input";
import { sortByName } from "~/utils/economy";
import { range } from "~/utils/number";
import { useLocalize, useRules } from "./app-context";
import { ItemImage } from "./item-image";
import { StickerPickerEditor } from "./sticker-picker-editor";
import { StickerPickerSelect } from "./sticker-picker-select";

export function StickerPicker({
  isCrafting,
  onChange,
  value
}: {
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
              <div className="absolute left-0 top-0 h-full w-full rounded border-[2.5px] border-transparent transition-all hover:border-white"></div>
            </button>
          );
        })}
      </div>
      <StickerPickerEditor />
      <StickerPickerSelect
        categories={categories}
        category={category}
        filtered={filtered}
        hidden={activeIndex === undefined}
        onAddSticker={handleAddSticker}
        onClose={handleCloseModal}
        onRemoveSticker={handleRemoveSticker}
        search={search}
        setCategory={setCategory}
        setSearch={setSearch}
        setWear={setWear}
        wear={wear}
      />
    </>
  );
}
