/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useState } from "react";
import { useItemSelectorContext } from "~/components/item-selector-context";
import { useRootContext } from "~/components/root-context";

export function useSwapItemsStatTrak() {
  const { inventory, items } = useRootContext();
  const { itemSelector, setItemSelector } = useItemSelectorContext();
  const [swapItemsStatTrak, setSwapItemsStatTrak] = useState<{
    fromIndex: number;
    toIndex?: number;
    toolIndex: number;
  }>();

  function handleSwapItemsStatTrak(index: number) {
    return setItemSelector({
      index,
      items: items.filter(
        ({ inventoryItem }) => inventoryItem.stattrak !== undefined
      ),
      type: "swap-items-stattrak"
    });
  }

  function handleSwapItemsStatTrakSelect(index: number) {
    const selectedItem = inventory.getItem(index);
    if (swapItemsStatTrak?.fromIndex !== undefined) {
      setSwapItemsStatTrak((existing) => ({
        ...existing!,
        toIndex: index
      }));
    } else {
      setSwapItemsStatTrak({
        fromIndex: index,
        toolIndex: itemSelector!.index
      });
      setItemSelector({
        index,
        items: items.filter(
          ({ inventoryItem, item, index: otherIndex }) =>
            inventoryItem.stattrak !== undefined &&
            otherIndex !== index &&
            selectedItem.type === item.type &&
            (selectedItem.type === "musickit" || selectedItem.def === item.def)
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
    return state?.toIndex !== undefined;
  }

  return {
    closeSwapItemsStatTrak,
    handleSwapItemsStatTrak,
    handleSwapItemsStatTrakSelect,
    isSwapingItemsStatTrak,
    swapItemsStatTrak
  };
}
