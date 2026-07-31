/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem, CS2ItemType } from "@ianlucas/cs2-lib";
import { useState } from "react";
import { toArrayIf } from "~/utils/misc";
import { useInventory, useRules, useTranslate } from "./app-context";
import { ItemEditor, ItemEditorAttributes } from "./item-editor";
import { ModalButton } from "./modal-button";

export function CraftNew({
  item,
  onClose,
  onSubmit
}: {
  item: CS2EconomyItem;
  onClose: () => void;
  onSubmit: (attributes: ItemEditorAttributes) => void;
}) {
  const translate = useTranslate();
  const {
    craftAllowKeychainSeed,
    craftAllowKeychains,
    craftAllowKeychainX,
    craftAllowKeychainY,
    craftAllowKeychainZ,
    craftAllowNametag,
    craftAllowPatches,
    craftAllowSeed,
    craftAllowStatTrak,
    craftAllowStickerRotation,
    craftAllowStickerSchema,
    craftAllowStickers,
    craftAllowStickerWear,
    craftAllowStickerX,
    craftAllowStickerY,
    craftAllowWear,
    craftHideCategory,
    craftHideId,
    craftHideType,
    craftMaxQuantity,
    inventoryItemMaxPatches,
    inventoryItemMaxStickers,
    inventoryMaxItems
  } = useRules();

  const [inventory] = useInventory();
  const [attributes, setAttributes] = useState<ItemEditorAttributes>();

  const inventoryMaxQuantity = inventoryMaxItems - inventory.size();
  const maxQuantity = Math.min(
    inventoryMaxQuantity,
    ...toArrayIf(craftMaxQuantity, (n) => n > 0)
  );

  const isHideNameTag = !craftAllowNametag;
  const isHideSeed = !craftAllowSeed;
  const isHideStatTrak = !craftAllowStatTrak;
  const isHideWear = !craftAllowWear;
  const isHideStickerRotation = !craftAllowStickerRotation;
  const isHideStickerSchema = !craftAllowStickerSchema;
  const isHideStickerWear = !craftAllowStickerWear;
  const isHideStickerX = !craftAllowStickerX;
  const isHideStickerY = !craftAllowStickerY;
  const isHideKeychainSeed = !craftAllowKeychainSeed;
  const isHideKeychainX = !craftAllowKeychainX;
  const isHideKeychainY = !craftAllowKeychainY;
  const isHideKeychainZ = !craftAllowKeychainZ;

  const isHidePatches =
    !craftAllowPatches ||
    craftHideType.includes(CS2ItemType.Patch) ||
    inventoryItemMaxPatches === 0;

  const isHideStickers =
    !craftAllowStickers ||
    craftHideType.includes(CS2ItemType.Sticker) ||
    inventoryItemMaxStickers === 0;

  const isHideKeychains =
    !craftAllowKeychains || craftHideType.includes(CS2ItemType.Keychain);

  function handleSubmit() {
    if (attributes !== undefined) {
      onSubmit(attributes);
    }
  }

  function filterStickerOrPatch({ id, loadoutCategory }: CS2EconomyItem) {
    if (craftHideId.includes(id)) {
      return false;
    }
    if (
      loadoutCategory !== undefined &&
      craftHideCategory.includes(loadoutCategory)
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
        maxQuantity={maxQuantity}
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
          children={translate("EditorCraft")}
          onClick={handleSubmit}
          variant="primary"
        />
      </div>
    </>
  );
}
