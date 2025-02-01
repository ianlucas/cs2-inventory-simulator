/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { assert } from "@ianlucas/cs2-lib";
import { useState } from "react";
import { useInventory, useInventoryItems } from "~/components/app-context";
import { useItemSelector } from "~/components/item-selector-context";

export function useApplyItemSticker() {
  const items = useInventoryItems();
  const [inventory] = useInventory();
  const [itemSelector, setItemSelector] = useItemSelector();
  const [applyItemSticker, setApplyItemSticker] = useState<{
    targetUid: number;
    stickerUid: number;
  }>();

  function handleApplyItemSticker(uid: number) {
    const selectedItem = inventory.get(uid);
    return setItemSelector({
      uid,
      items: items.filter(({ item }) =>
        selectedItem.isSticker()
          ? item.hasStickers() && item.getStickersCount() < 4
          : selectedItem.getStickersCount() < 4 && item.isSticker()
      ),
      type: "apply-item-sticker"
    });
  }

  function handleApplyItemStickerSelect(uid: number) {
    assert(itemSelector !== undefined);
    const isSticker = uid >= 0 ? inventory.get(uid).isSticker() : false;
    return setApplyItemSticker({
      targetUid: !isSticker ? uid : itemSelector.uid,
      stickerUid: isSticker ? uid : itemSelector.uid
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
