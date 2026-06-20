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
  assert,
  ensure
} from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { useInput } from "~/components/hooks/use-input";
import { sortByName } from "~/utils/economy";
import { range } from "~/utils/number";
import { useTranslate } from "./app-context";
import { AppliedStickerEditor } from "./applied-sticker-editor";
import { ButtonWithTooltip } from "./button-with-tooltip";
import { IconInput } from "./icon-input";
import { IconSelect } from "./icon-select";
import { ItemBrowser } from "./item-browser";
import { ItemImage } from "./item-image";
import { Modal, ModalHeader, ModalNav } from "./modal";
import { ModalButton } from "./modal-button";
import { confirm } from "./modal-generic";

export function StickerPicker({
  disabled,
  forItem,
  isHideStickerRotation,
  isHideStickerSchema,
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
  isHideStickerSchema?: boolean;
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
    schema: -1,
    wear: 0,
    x: 0,
    y: 0
  });
  const [selected, setSelected] = useState<CS2EconomyItem>();
  const [isEditing, setIsEditing] = useState(false);
  const canEditStickerAttributes =
    !isHideStickerRotation &&
    !isHideStickerSchema &&
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
      const { id, rotation, schema, wear, x, y } = value[index];
      setAppliedStickerData({
        rotation: rotation ?? 0,
        schema: schema ?? -1,
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
        schema:
          appliedStickerData.schema !== -1
            ? appliedStickerData.schema
            : undefined,
        wear: appliedStickerData.wear || undefined,
        x: appliedStickerData.x || undefined,
        y: appliedStickerData.y || undefined
      }
    });
    setSelected(undefined);
    setActiveIndex(undefined);
    setIsEditing(false);
  }

  function handleRemoveSticker(index: number) {
    return async function handleRemoveSticker() {
      if (
        await confirm({
          titleText: translate("StickerPickerRemove"),
          bodyText: translate("StickerPickerRemoveConfirm"),
          cancelText: translate("GenericNo"),
          confirmText: translate("GenericYes")
        })
      ) {
        const updated = { ...value };
        delete updated[index];
        onChange(updated);
      }
    };
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
          const item =
            sticker !== undefined ? CS2Economy.getById(sticker.id) : undefined;
          return (
            <div className="relative aspect-256/192" key={index}>
              <button
                disabled={disabled}
                className="absolute size-full cursor-default overflow-hidden bg-neutral-950/40"
                onClick={handleClickSlot(index)}
              >
                {item !== undefined ? (
                  <ItemImage item={item} />
                ) : (
                  <div className="flex items-center justify-center text-neutral-700">
                    {translate("StickerPickerNA")}
                  </div>
                )}
                {!disabled && (
                  <div className="absolute top-0 left-0 size-full border-2 border-transparent hover:border-blue-500/50" />
                )}
              </button>
              {item !== undefined && !disabled && (
                <>
                  <ButtonWithTooltip
                    onClick={handleRemoveSticker(index)}
                    className="absolute bottom-1 left-1 hover:bg-red-500/50"
                    tooltip={translate("StickerPickerRemove")}
                  >
                    <FontAwesomeIcon icon={faTrashCan} className="h-3" />
                  </ButtonWithTooltip>
                  <ButtonWithTooltip
                    onClick={handleClickEditSlot(index)}
                    className="absolute right-1 bottom-1 hover:bg-blue-500/50"
                    tooltip={translate("EditorStickerEdit")}
                  >
                    <FontAwesomeIcon icon={faPen} className="h-3" />
                  </ButtonWithTooltip>
                </>
              )}
            </div>
          );
        })}
      </div>
      <Modal
        className="w-135 pb-1"
        hidden={activeIndex === undefined || isEditing}
        blur
      >
        <ModalHeader
          title={translate("StickerPickerHeader")}
          onClose={handleCloseModal}
        />
        <ModalNav
          items={[]}
          right={
            <div className="flex items-center gap-2">
              <IconSelect
                icon={faTag}
                className={clsx(
                  "h-4 w-42 shrink-0 outline-hidden",
                  category === "" && "text-neutral-600"
                )}
                onChange={setCategory}
                options={categories}
                placeholder={translate("StickerPickerFilterPlaceholder")}
                styleless
                value={category}
              />
              <IconInput
                icon={faMagnifyingGlass}
                labelStyles="w-44 shrink-0"
                onChange={setSearch}
                placeholder={translate("StickerPickerSearchPlaceholder")}
                value={search}
              />
            </div>
          }
        />
        <ItemBrowser items={filtered} onClick={handleSelectSticker} />
      </Modal>
      {selected !== undefined && (
        <Modal className="w-105">
          <ModalHeader
            title={translate("ApplyStickerUse")}
            onClose={handleCloseSelectModal}
          />
          {canEditStickerAttributes && (
            <AppliedStickerEditor
              slot={activeIndex}
              className="px-4"
              forItem={forItem}
              isHideStickerRotation={isHideStickerRotation}
              isHideStickerSchema={isHideStickerSchema}
              isHideStickerWear={isHideStickerWear}
              isHideStickerX={isHideStickerX}
              isHideStickerY={isHideStickerY}
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
              children={translate("EditorApply")}
              onClick={handleAddSticker}
              variant="primary"
            />
          </div>
        </Modal>
      )}
    </>
  );
}
