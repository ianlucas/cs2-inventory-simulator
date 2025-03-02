/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2EconomyItem,
  CS2InventoryItem,
  CS2ItemType
} from "@ianlucas/cs2-lib";
import { useState } from "react";
import { useRules, useTranslate } from "./app-context";
import { ItemEditor, ItemEditorAttributes } from "./item-editor";
import { ModalButton } from "./modal-button";

export function CraftEdit({
  item,
  onClose,
  onSubmit
}: {
  item: CS2InventoryItem | CS2EconomyItem;
  onClose: () => void;
  onSubmit: (attributes: ItemEditorAttributes) => void;
}) {
  const translate = useTranslate();
  const {
    editAllowNametag,
    editAllowPatches,
    editAllowSeed,
    editAllowStatTrak,
    editAllowStickerRotation,
    editAllowStickers,
    editAllowStickerWear,
    editAllowStickerX,
    editAllowStickerY,
    editAllowWear,
    editHideCategory,
    editHideId,
    editHideType
  } = useRules();

  const [attributes, setAttributes] = useState<ItemEditorAttributes>();

  const isHideNameTag = !editAllowNametag;
  const isHideSeed = !editAllowSeed;
  const isHideStatTrak = !editAllowStatTrak;
  const isHideWear = !editAllowWear;
  const isHideStickerRotation = !editAllowStickerRotation;
  const isHideStickerWear = !editAllowStickerWear;
  const isHideStickerX = !editAllowStickerX;
  const isHideStickerY = !editAllowStickerY;

  const isHidePatches =
    !editAllowPatches || editHideType.includes(CS2ItemType.Patch);

  const isHideStickers =
    !editAllowStickers || editHideType.includes(CS2ItemType.Sticker);

  function handleSubmit() {
    if (attributes !== undefined) {
      onSubmit(attributes);
    }
  }

  function filterStickerOrPatch(item: CS2EconomyItem) {
    if (editHideId.includes(item.id)) {
      return false;
    }
    if (
      item.category !== undefined &&
      editHideCategory.includes(item.category)
    ) {
      return false;
    }
    return true;
  }

  return (
    <>
      <ItemEditor
        className="px-4"
        isHideNameTag={isHideNameTag}
        isHidePatches={isHidePatches}
        isHideSeed={isHideSeed}
        isHideStatTrak={isHideStatTrak}
        isHideStickerRotation={isHideStickerRotation}
        isHideStickers={isHideStickers}
        isHideStickerWear={isHideStickerWear}
        isHideStickerX={isHideStickerX}
        isHideStickerY={isHideStickerY}
        isHideWear={isHideWear}
        item={item}
        onChange={setAttributes}
        patchFilter={filterStickerOrPatch}
        stickerFilter={filterStickerOrPatch}
      />
      <div className="my-6 flex justify-center gap-2">
        <ModalButton
          children={translate("EditorCancel")}
          onClick={onClose}
          variant="secondary"
        />
        <ModalButton
          children={translate("EditorSave")}
          onClick={handleSubmit}
          variant="primary"
        />
      </div>
    </>
  );
}
