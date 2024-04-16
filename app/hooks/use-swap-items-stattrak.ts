/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useState } from "react";
import { useAppContext } from "~/components/app-context";
import { useItemSelectorContext } from "~/components/item-selector-context";

export function useSwapItemsStatTrak() {
  const { inventory, items } = useAppContext();
  const { itemSelector, setItemSelector } = useItemSelectorContext();
  const [swapItemsStatTrak, setSwapItemsStatTrak] = useState<{
    fromUid: number;
    toUid?: number;
    toolUid: number;
  }>();

  function handleSwapItemsStatTrak(uid: number) {
    return setItemSelector({
      uid,
      items: items.filter(({ item }) => item.stattrak !== undefined),
      type: "swap-items-stattrak"
    });
  }

  function handleSwapItemsStatTrakSelect(uid: number) {
    const { data: selectedItem } = inventory.get(uid);
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
            item.stattrak !== undefined &&
            otherUid !== uid &&
            selectedItem.type === item.data.type &&
            (selectedItem.type === "musickit" ||
              selectedItem.def === item.data.def)
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
