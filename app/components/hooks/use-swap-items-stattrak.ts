/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2ItemType } from "@ianlucas/cs2-lib";
import { useState } from "react";
import { useInventory, useInventoryItems } from "~/components/app-context";
import { useItemSelector } from "~/components/item-selector-context";

export function useSwapItemsStatTrak() {
  const [inventory] = useInventory();
  const items = useInventoryItems();
  const [itemSelector, setItemSelector] = useItemSelector();
  const [swapItemsStatTrak, setSwapItemsStatTrak] = useState<{
    fromUid: number;
    toUid?: number;
    toolUid: number;
  }>();

  function handleSwapItemsStatTrak(uid: number) {
    return setItemSelector({
      uid,
      items: items.filter(({ item }) => item.statTrak !== undefined),
      type: "swap-items-stattrak"
    });
  }

  function handleSwapItemsStatTrakSelect(uid: number) {
    const selectedItem = inventory.get(uid);
    if (swapItemsStatTrak?.fromUid !== undefined) {
      setSwapItemsStatTrak((existing) => ({
        ...existing!,
        toUid: uid
      }));
    } else {
      setSwapItemsStatTrak({
        fromUid: uid,
        toolUid: itemSelector!.uid
      });
      setItemSelector({
        uid: uid,
        items: items.filter(
          ({ item, uid: otherUid }) =>
            item.statTrak !== undefined &&
            otherUid !== uid &&
            selectedItem.type === item.type &&
            (selectedItem.type === CS2ItemType.MusicKit ||
              selectedItem.def === item.def)
        ),
        type: "swap-items-stattrak"
      });
    }
  }

  function closeSwapItemsStatTrak() {
    return setSwapItemsStatTrak(undefined);
  }

  function isSwapingItemsStatTrak(
    state: typeof swapItemsStatTrak
  ): state is Required<NonNullable<typeof swapItemsStatTrak>> {
    return state?.toUid !== undefined;
  }

  return {
    closeSwapItemsStatTrak,
    handleSwapItemsStatTrak,
    handleSwapItemsStatTrakSelect,
    isSwapingItemsStatTrak,
    swapItemsStatTrak
  };
}
