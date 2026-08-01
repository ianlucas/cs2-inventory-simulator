/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { assert } from "@ianlucas/cs2-lib";
import { useState } from "react";
import { useInventory, useInventoryItems } from "~/components/app-context";
import { useItemSelector } from "~/components/item-selector-context";

export function useSealItemSticker() {
  const items = useInventoryItems();
  const [inventory] = useInventory();
  const [itemSelector, setItemSelector] = useItemSelector();
  const [sealItemSticker, setSealItemSticker] = useState<{
    toolUid: number;
    stickerUid: number;
  }>();

  function handleSealItemSticker(uid: number) {
    const selectedItem = inventory.get(uid);
    return setItemSelector({
      uid,
      items: items.filter(
        ({ uid: itemUid, item }) =>
          itemUid >= 0 &&
          (selectedItem.isSticker()
            ? item.isStickerSlab()
            : item.isSticker() && item.hasDisplayCase())
      ),
      type: "seal-item-sticker"
    });
  }

  function handleSealItemStickerSelect(uid: number) {
    assert(itemSelector !== undefined);
    const isSticker = inventory.get(uid).isSticker();
    return setSealItemSticker({
      toolUid: !isSticker ? uid : itemSelector.uid,
      stickerUid: isSticker ? uid : itemSelector.uid
    });
  }

  function closeSealItemSticker() {
    return setSealItemSticker(undefined);
  }

  function isSealingItemSticker(
    state: typeof sealItemSticker
  ): state is NonNullable<typeof sealItemSticker> {
    return state !== undefined;
  }

  return {
    closeSealItemSticker,
    handleSealItemSticker,
    handleSealItemStickerSelect,
    isSealingItemSticker,
    sealItemSticker
  };
}
