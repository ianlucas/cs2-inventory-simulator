/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faPen, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS2BaseInventoryItem,
  CS2Economy,
  CS2EconomyItem,
  assert,
  ensure
} from "@ianlucas/cs2-lib";
import { useState } from "react";
import { useTranslate } from "./app-context";
import { AppliedStickerEditor } from "./applied-sticker-editor";
import { ButtonWithTooltip } from "./button-with-tooltip";
import { Modal, ModalHeader } from "./modal";
import { ModalButton } from "./modal-button";
import { confirm } from "./modal-generic";
import { SelectStickerModal } from "./select-sticker-modal";
import { StickerSlotGrid } from "./sticker-slot-grid";

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

  const [activeIndex, setActiveIndex] = useState<number>();
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

  return (
    <>
      <StickerSlotGrid
        disabled={disabled}
        onSlotClick={(index) => setActiveIndex(index)}
        renderSlotOverlay={(index) => (
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
        value={value}
      />
      <SelectStickerModal
        hidden={activeIndex === undefined || isEditing}
        onClose={handleCloseModal}
        onSelect={handleSelectSticker}
        stickerFilter={stickerFilter}
      />
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
