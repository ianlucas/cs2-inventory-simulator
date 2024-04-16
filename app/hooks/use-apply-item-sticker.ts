/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Economy } from "@ianlucas/cs2-lib";
import { useState } from "react";
import { useItemSelectorContext } from "~/components/item-selector-context";
import { useRootContext } from "~/components/root-context";
import { getStickerCount } from "~/utils/inventory";

export function useApplyItemSticker() {
  const { inventory, items } = useRootContext();
  const { itemSelector, setItemSelector } = useItemSelectorContext();
  const [applyItemSticker, setApplyItemSticker] = useState<{
    targetUid: number;
    stickerUid: number;
  }>();

  function handleApplyItemSticker(uid: number) {
    const { data: selectedItem, stickers: selectedStickers } =
      inventory.get(uid);
    return setItemSelector({
      uid,
      items: items.filter(
        ({ item }) =>
          (CS_Economy.isSticker(selectedItem) &&
            CS_Economy.hasStickers(item.data) &&
            getStickerCount(item.stickers) < 4) ||
          (!CS_Economy.isSticker(selectedItem) &&
            getStickerCount(selectedStickers) < 4 &&
            CS_Economy.isSticker(item.data))
      ),
      type: "apply-item-sticker"
    });
  }

  function handleApplyItemStickerSelect(uid: number) {
    const {
      data: { type }
    } = inventory.get(uid);
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
