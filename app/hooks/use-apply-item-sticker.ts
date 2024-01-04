/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_hasStickers } from "@ianlucas/cslib";
import { useState } from "react";
import { useItemSelectorContext } from "~/components/item-selector-context";
import { useRootContext } from "~/components/root-context";

export function useApplyItemSticker() {
  const { inventory, items } = useRootContext();
  const { itemSelector, setItemSelector } = useItemSelectorContext();
  const [applyItemSticker, setApplyItemSticker] = useState<{
    itemIndex: number;
    stickerItemIndex: number;
  }>();

  function handleApplyItemSticker(index: number) {
    const selectedItem = inventory.getItem(index);
    return setItemSelector({
      index,
      items: items.filter(
        ({ item }) =>
          !item.free &&
          ((selectedItem.type === "sticker" && CS_hasStickers(item)) ||
            (selectedItem.type !== "sticker" && item.type === "sticker"))
      ),
      type: "apply-item-sticker"
    });
  }

  function handleApplyItemStickerSelect(index: number) {
    const { type } = inventory.getItem(index);
    return setApplyItemSticker({
      itemIndex: type !== "sticker" ? index : itemSelector!.index,
      stickerItemIndex: type === "sticker" ? index : itemSelector!.index
    });
  }

  function closeApplyItemSticker() {
    return setApplyItemSticker(undefined);
  }

  return {
    applyItemSticker,
    closeApplyItemSticker,
    handleApplyItemSticker,
    handleApplyItemStickerSelect
  };
}
