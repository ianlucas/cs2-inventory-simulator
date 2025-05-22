/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  faMagnifyingGlass,
  faPen,
  faTag,
  faTrashCan
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS2BaseInventoryItem,
  CS2Economy,
  CS2EconomyItem,
  CS2_MAX_STICKERS,
  CS2_MIN_STICKER_WEAR,
  assert,
  ensure
} from "@ianlucas/cs2-lib";
import { useMemo, useState } from "react";
import { useInput } from "~/components/hooks/use-input";
import { sortByName } from "~/utils/economy";
import { range } from "~/utils/number";
import { useTranslate } from "./app-context";
import { AppliedStickerEditor } from "./applied-sticker-editor";
import { ButtonWithTooltip } from "./button-with-tooltip";
import { IconButton } from "./icon-button";
import { IconInput } from "./icon-input";
import { IconSelect } from "./icon-select";
import { ItemBrowser } from "./item-browser";
import { ItemImage } from "./item-image";
import { Modal, ModalHeader } from "./modal";
import { ModalButton } from "./modal-button";

export function StickerPicker({
  disabled,
  forItem,
  isHideStickerRotation,
  isHideStickerWear,
  isHideStickerX,
  isHideStickerY,
  onChange,
  stickerFilter,
  value
}: {
  disabled?: boolean;
  forItem?: CS2EconomyItem;
  isHideStickerRotation?: boolean;
  isHideStickerWear?: boolean;
  isHideStickerX?: boolean;
  isHideStickerY?: boolean;
  onChange: (value: NonNullable<CS2BaseInventoryItem["stickers"]>) => void;
  stickerFilter?: (item: CS2EconomyItem) => boolean;
  value: NonNullable<CS2BaseInventoryItem["stickers"]>;
}) {
  const translate = useTranslate();

  const [category, setCategory] = useState("");
  const [search, setSearch] = useInput("");
  const [activeIndex, setActiveIndex] = useState<number>();
  const stickers = useMemo(() => CS2Economy.getStickers().sort(sortByName), []);
  const categories = useMemo(() => CS2Economy.getStickerCategories(), []);
  const [appliedStickerData, setAppliedStickerData] = useState({
    rotation: 0,
    wear: 0,
    x: 0,
    y: 0
  });
  const [selected, setSelected] = useState<CS2EconomyItem>();
  const [isEditing, setIsEditing] = useState(false);
  const canEditStickerAttributes =
    !isHideStickerRotation &&
    !isHideStickerWear &&
    !isHideStickerX &&
    !isHideStickerY;

  function handleClickSlot(index: number) {
    return function handleClickSlot() {
      setActiveIndex(index);
    };
  }

  function handleClickEditSlot(index: number) {
    return function handleClickSlot() {
      const { id, rotation, wear, x, y } = value[index];
      setAppliedStickerData({
        rotation: rotation ?? 0,
        wear: wear ?? 0,
        x: x ?? 0,
        y: y ?? 0
      });
      setActiveIndex(index);
      setSelected(CS2Economy.getById(id));
      setIsEditing(true);
    };
  }

  function handleSelectSticker(item: CS2EconomyItem) {
    setSelected(item);
  }

  function handleCloseSelectModal() {
    if (isEditing) {
      setActiveIndex(undefined);
    }
    setSelected(undefined);
    setIsEditing(false);
  }

  function handleAddSticker() {
    assert(selected);
    onChange({
      ...value,
      [ensure(activeIndex)]: {
        id: selected.id,
        rotation: appliedStickerData.rotation || undefined,
        wear: appliedStickerData.wear || undefined,
        x: appliedStickerData.x || undefined,
        y: appliedStickerData.y || undefined
      }
    });
    setSelected(undefined);
    setActiveIndex(undefined);
    setIsEditing(false);
  }

  function handleRemoveSticker() {
    const updated = { ...value };
    delete updated[ensure(activeIndex)];
    onChange(updated);
    setActiveIndex(undefined);
    setIsEditing(false);
  }

  function handleCloseModal() {
    setActiveIndex(undefined);
    setIsEditing(false);
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
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${CS2_MAX_STICKERS}, minmax(0, 1fr))`
        }}
      >
        {range(CS2_MAX_STICKERS).map((index) => {
          const sticker = value[index];
          const stickerWear = sticker?.wear ?? CS2_MIN_STICKER_WEAR;
          const item =
            sticker !== undefined ? CS2Economy.getById(sticker.id) : undefined;
          return (
            <div className="relative aspect-256/192" key={index}>
              <button
                disabled={disabled}
                className="absolute h-full w-full cursor-default overflow-hidden bg-neutral-950/40"
                onClick={handleClickSlot(index)}
              >
                {item !== undefined ? (
                  <ItemImage item={item} />
                ) : (
                  <div className="flex items-center justify-center text-neutral-700">
                    {translate("StickerPickerNA")}
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
              {item !== undefined && !disabled && (
                <ButtonWithTooltip
                  onClick={handleClickEditSlot(index)}
                  className="absolute bottom-1 left-1 hover:bg-blue-500/50"
                  tooltip={translate("EditorStickerEdit")}
                >
                  <FontAwesomeIcon icon={faPen} className="h-3" />
                </ButtonWithTooltip>
              )}
            </div>
          );
        })}
      </div>
      <Modal
        className="w-[540px] pb-1"
        hidden={activeIndex === undefined || isEditing}
        blur
      >
        <ModalHeader
          title={translate("StickerPickerHeader")}
          onClose={handleCloseModal}
        />
        <div className="my-2 flex flex-col gap-2 px-2 lg:flex-row lg:items-center">
          <IconInput
            icon={faMagnifyingGlass}
            labelStyles="flex-1"
            onChange={setSearch}
            placeholder={translate("StickerPickerSearchPlaceholder")}
            value={search}
          />
          <IconSelect
            icon={faTag}
            className="w-[168px]"
            onChange={setCategory}
            options={categories}
            placeholder={translate("StickerPickerFilterPlaceholder")}
            value={category}
          />
          <IconButton
            icon={faTrashCan}
            onClick={handleRemoveSticker}
            title={translate("StickerPickerRemove")}
          />
        </div>
        <ItemBrowser items={filtered} onClick={handleSelectSticker} />
      </Modal>
      {selected !== undefined && (
        <Modal className="w-[420px]">
          <ModalHeader
            title={translate("EditorConfirmPick")}
            onClose={handleCloseSelectModal}
          />
          {canEditStickerAttributes && (
            <AppliedStickerEditor
              slot={activeIndex}
              className="px-4"
              forItem={forItem}
              item={selected}
              onChange={setAppliedStickerData}
              stickers={value}
              value={appliedStickerData}
            />
          )}
          <div className="my-6 flex justify-center gap-2">
            <ModalButton
              children={translate("EditorCancel")}
              onClick={handleCloseSelectModal}
              variant="secondary"
            />
            <ModalButton
              children={translate("EditorPick")}
              onClick={handleAddSticker}
              variant="primary"
            />
          </div>
        </Modal>
      )}
    </>
  );
}
