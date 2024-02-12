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
    targetUid: number;
    stickerUid: number;
  }>();

  function handleApplyItemSticker(uid: number) {
    const selectedItem = inventory.getItem(uid);
    return setItemSelector({
      uid,
      items: items.filter(
        ({ item }) =>
          !item.free &&
          ((selectedItem.type === "sticker" && CS_hasStickers(item)) ||
            (selectedItem.type !== "sticker" && item.type === "sticker"))
      ),
      type: "apply-item-sticker"
    });
  }

  function handleApplyItemStickerSelect(uid: number) {
    const { type } = inventory.getItem(uid);
    return setApplyItemSticker({
      targetUid: type !== "sticker" ? uid : itemSelector!.uid,
      stickerUid: type === "sticker" ? uid : itemSelector!.uid
    });
  }

  function closeApplyItemSticker() {
    return setApplyItemSticker(undefined);
  }

  function isApplyingItemSticker(
    state: typeof applyItemSticker
  ): state is NonNullable<typeof applyItemSticker> {
    return state !== undefined;
  }

  return {
    applyItemSticker,
    closeApplyItemSticker,
    handleApplyItemSticker,
    handleApplyItemStickerSelect,
    isApplyingItemSticker
  };
}
