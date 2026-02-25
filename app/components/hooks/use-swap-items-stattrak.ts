/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ensure } from "@ianlucas/cs2-lib";
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
        ...ensure(existing),
        toUid: uid
      }));
    } else if (itemSelector !== undefined) {
      setSwapItemsStatTrak({
        fromUid: uid,
        toolUid: itemSelector.uid
      });
      setItemSelector({
        uid: uid,
        items: items.filter(
          ({ item, uid: xuid }) =>
            item.statTrak !== undefined &&
            xuid !== uid &&
            selectedItem.type === item.type &&
            (selectedItem.isMusicKit() || selectedItem.def === item.def)
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
