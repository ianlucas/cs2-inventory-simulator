/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem, CS2ItemType } from "@ianlucas/cs2-lib";
import { useState } from "react";
import { useInventory, useLocalize, useRules } from "./app-context";
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
  const localize = useLocalize();
  const {
    craftMaxQuantity,
    craftAllowNametag,
    craftAllowPatches,
    craftAllowSeed,
    craftAllowStatTrak,
    craftAllowStickers,
    craftAllowWear,
    craftHideCategory,
    craftHideId,
    craftHideType,
    inventoryMaxItems
  } = useRules();

  const [inventory] = useInventory();
  const [attributes, setAttributes] = useState<ItemEditorAttributes>();

  const inventoryMaxQuantity = inventoryMaxItems - inventory.size();
  const maxQuantity =
    inventoryMaxItems !== 0
      ? Math.min(craftMaxQuantity, inventoryMaxQuantity)
      : inventoryMaxQuantity;

  const isHideNameTag = !craftAllowNametag;
  const isHideSeed = !craftAllowSeed;
  const isHideStatTrak = !craftAllowStatTrak;
  const isHideWear = !craftAllowWear;

  const isHidePatches =
    !craftAllowPatches || craftHideType.includes(CS2ItemType.Patch);

  const isHideStickers =
    !craftAllowStickers || craftHideType.includes(CS2ItemType.Sticker);

  function handleSubmit() {
    if (attributes !== undefined) {
      onSubmit(attributes);
    }
  }

  function filterStickerOrPatch(item: CS2EconomyItem) {
    if (craftHideId.includes(item.id)) {
      return false;
    }
    if (
      item.category !== undefined &&
      craftHideCategory.includes(item.category)
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
        isHideStickers={isHideStickers}
        isHideWear={isHideWear}
        item={item}
        maxQuantity={maxQuantity}
        onChange={setAttributes}
        patchFilter={filterStickerOrPatch}
        stickerFilter={filterStickerOrPatch}
      />
      <div className="my-6 flex justify-center gap-2">
        <ModalButton
          children={localize("EditorCancel")}
          onClick={onClose}
          variant="secondary"
        />
        <ModalButton
          children={localize("EditorCraft")}
          onClick={handleSubmit}
          variant="primary"
        />
      </div>
    </>
  );
}
