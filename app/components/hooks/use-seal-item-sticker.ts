/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { assert } from "@ianlucas/cs2-lib";
import { useState } from "react";
import { useInventory, useInventoryItems } from "~/components/app-context";
import { useTimer } from "~/components/hooks/use-timer";
import { useItemSelector } from "~/components/item-selector-context";

const OVERLAY_EXIT_MS = 600;

export function useSealItemSticker() {
  const items = useInventoryItems();
  const [inventory] = useInventory();
  const [itemSelector, setItemSelector] = useItemSelector();
  const [sealItemSticker, setSealItemSticker] = useState<{
    toolUid?: number;
    stickerUid: number;
  }>();
  const wait = useTimer();

  function handleSealItemSticker(uid: number) {
    const selectedItem = inventory.get(uid);
    if (
      selectedItem.isSticker() &&
      !items.some(
        ({ uid: itemUid, item }) => itemUid >= 0 && item.isStickerSlab()
      )
    ) {
      return setSealItemSticker({ stickerUid: uid });
    }
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

  function handleSealItemStickerCrafted(toolUid: number) {
    assert(sealItemSticker !== undefined);
    const { stickerUid } = sealItemSticker;
    setSealItemSticker(undefined);
    wait(() => setSealItemSticker({ toolUid, stickerUid }), OVERLAY_EXIT_MS);
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
    handleSealItemStickerCrafted,
    handleSealItemStickerSelect,
    isSealingItemSticker,
    sealItemSticker
  };
}
