/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  faMagnifyingGlass,
  faTag,
  faTrashCan
} from "@fortawesome/free-solid-svg-icons";
import {
  CS2BaseInventoryItem,
  CS2Economy,
  CS2EconomyItem,
  CS2_MIN_STICKER_WEAR,
  assert,
  ensure
} from "@ianlucas/cs2-lib";
import { useMemo, useState } from "react";
import { useInput } from "~/components/hooks/use-input";
import { sortByName } from "~/utils/economy";
import { range } from "~/utils/number";
import { useLocalize } from "./app-context";
import { AppliedStickerEditor } from "./applied-sticker-editor";
import { IconButton } from "./icon-button";
import { IconInput } from "./icon-input";
import { IconSelect } from "./icon-select";
import { ItemBrowser } from "./item-browser";
import { ItemImage } from "./item-image";
import { Modal, ModalHeader } from "./modal";
import { ModalButton } from "./modal-button";

export function StickerPicker({
  disabled,
  onChange,
  stickerFilter,
  value
}: {
  disabled?: boolean;
  onChange: (value: NonNullable<CS2BaseInventoryItem["stickers"]>) => void;
  stickerFilter?: (item: CS2EconomyItem) => boolean;
  value: NonNullable<CS2BaseInventoryItem["stickers"]>;
}) {
  const localize = useLocalize();

  const [category, setCategory] = useState("");
  const [search, setSearch] = useInput("");
  const [activeIndex, setActiveIndex] = useState<number>();
  const stickers = useMemo(() => CS2Economy.getStickers().sort(sortByName), []);
  const categories = useMemo(() => CS2Economy.getStickerCategories(), []);
  const [appliedStickerData, setAppliedStickerData] = useState({
    wear: 0
  });
  const [selected, setSelected] = useState<CS2EconomyItem>();

  function handleClickSlot(index: number) {
    return function handleClickSlot() {
      setActiveIndex(index);
    };
  }

  function handleSelectSticker(item: CS2EconomyItem) {
    setSelected(item);
  }

  function handleCloseSelectModal() {
    setSelected(undefined);
  }

  function handleAddSticker() {
    assert(selected);
    onChange({
      ...value,
      [ensure(activeIndex)]: {
        id: selected.id,
        wear: appliedStickerData.wear
      }
    });
    setSelected(undefined);
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
      if (stickerFilter !== undefined && !stickerFilter(item)) {
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
      <div className="grid grid-cols-4 gap-2">
        {range(4).map((index) => {
          const sticker = value[index];
          const stickerWear = sticker?.wear ?? CS2_MIN_STICKER_WEAR;
          const item =
            sticker !== undefined ? CS2Economy.getById(sticker.id) : undefined;
          return (
            <button
              disabled={disabled}
              key={index}
              className="relative aspect-256/192 cursor-default overflow-hidden bg-neutral-950/40"
              onClick={handleClickSlot(index)}
            >
              {item !== undefined ? (
                <ItemImage className="aspect-256/192" item={item} />
              ) : (
                <div className="flex aspect-256/192 items-center justify-center text-neutral-700">
                  {localize("StickerPickerNA")}
                </div>
              )}
              {sticker !== undefined && (
                <div className="text-outline-1 absolute right-1 bottom-0 text-sm font-bold drop-shadow-lg">
                  {(stickerWear * 100).toFixed(0)}%
                </div>
              )}
              {!disabled && (
                <div className="absolute top-0 left-0 h-full w-full border-2 border-transparent hover:border-blue-500/50" />
              )}
            </button>
          );
        })}
      </div>
      <Modal className="w-[540px] pb-1" hidden={activeIndex === undefined} blur>
        <ModalHeader
          title={localize("StickerPickerHeader")}
          onClose={handleCloseModal}
        />
        <div className="my-2 flex flex-col gap-2 px-2 lg:flex-row lg:items-center">
          <IconInput
            icon={faMagnifyingGlass}
            labelStyles="flex-1"
            onChange={setSearch}
            placeholder={localize("StickerPickerSearchPlaceholder")}
            value={search}
          />
          <IconSelect
            icon={faTag}
            className="w-[168px]"
            onChange={setCategory}
            options={categories}
            placeholder={localize("StickerPickerFilterPlaceholder")}
            value={category}
          />
          <IconButton
            icon={faTrashCan}
            onClick={handleRemoveSticker}
            title={localize("StickerPickerRemove")}
          />
        </div>
        <ItemBrowser items={filtered} onClick={handleSelectSticker} />
      </Modal>
      {selected !== undefined && (
        <Modal className="w-[420px]">
          <ModalHeader
            title={localize("EditorConfirmPick")}
            onClose={handleCloseSelectModal}
          />
          <AppliedStickerEditor
            className="px-4"
            item={selected}
            onChange={setAppliedStickerData}
            value={appliedStickerData}
          />
          <div className="my-6 flex justify-center gap-2">
            <ModalButton
              children={localize("EditorCancel")}
              onClick={handleCloseSelectModal}
              variant="secondary"
            />
            <ModalButton
              children={localize("EditorPick")}
              onClick={handleAddSticker}
              variant="primary"
            />
          </div>
        </Modal>
      )}
    </>
  );
}
