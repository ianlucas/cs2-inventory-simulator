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
    editAllowKeychainSeed,
    editAllowKeychains,
    editAllowKeychainX,
    editAllowKeychainY,
    editAllowKeychainZ,
    editAllowNametag,
    editAllowPatches,
    editAllowSeed,
    editAllowStatTrak,
    editAllowStickerRotation,
    editAllowStickerSchema,
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
  const isHideStickerSchema = !editAllowStickerSchema;
  const isHideStickerWear = !editAllowStickerWear;
  const isHideStickerX = !editAllowStickerX;
  const isHideStickerY = !editAllowStickerY;
  const isHideKeychainSeed = !editAllowKeychainSeed;
  const isHideKeychainX = !editAllowKeychainX;
  const isHideKeychainY = !editAllowKeychainY;
  const isHideKeychainZ = !editAllowKeychainZ;

  const isHidePatches =
    !editAllowPatches || editHideType.includes(CS2ItemType.Patch);

  const isHideStickers =
    !editAllowStickers || editHideType.includes(CS2ItemType.Sticker);

  const isHideKeychains =
    !editAllowKeychains || editHideType.includes(CS2ItemType.Keychain);

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
        isHideKeychainSeed={isHideKeychainSeed}
        isHideKeychains={isHideKeychains}
        isHideKeychainX={isHideKeychainX}
        isHideKeychainY={isHideKeychainY}
        isHideKeychainZ={isHideKeychainZ}
        isHideNameTag={isHideNameTag}
        isHidePatches={isHidePatches}
        isHideSeed={isHideSeed}
        isHideStatTrak={isHideStatTrak}
        isHideStickerRotation={isHideStickerRotation}
        isHideStickerSchema={isHideStickerSchema}
        isHideStickers={isHideStickers}
        isHideStickerWear={isHideStickerWear}
        isHideStickerX={isHideStickerX}
        isHideStickerY={isHideStickerY}
        isHideWear={isHideWear}
        item={item}
        keychainFilter={filterStickerOrPatch}
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
