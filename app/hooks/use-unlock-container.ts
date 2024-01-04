/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useState } from "react";
import { useItemSelectorContext } from "~/components/item-selector-context";
import { useRootContext } from "~/components/root-context";

export function useUnlockContainer() {
  const { inventory, items } = useRootContext();
  const { itemSelector, setItemSelector } = useItemSelectorContext();
  const [unlockContainer, setUnlockContainer] = useState<{
    caseIndex: number;
    keyIndex?: number;
  }>();

  function handleUnlockContainer(index: number) {
    const selectedItem = inventory.getItem(index);
    if (selectedItem.keys || selectedItem.type === "key") {
      return setItemSelector({
        index,
        items: items.filter(
          ({ item }) =>
            (selectedItem.type === "key" &&
              item.keys?.includes(selectedItem.id)) ||
            (selectedItem.type === "case" &&
              selectedItem.keys?.includes(item.id))
        ),
        type: "case-opening"
      });
    }
    if (selectedItem.type === "case") {
      return setUnlockContainer({
        caseIndex: index
      });
    }
  }

  function handleUnlockContainerSelect(index: number) {
    const selectedItem = inventory.getItem(index);
    return setUnlockContainer({
      caseIndex: selectedItem.type === "case" ? index : itemSelector!.index,
      keyIndex: selectedItem.type === "key" ? index : itemSelector!.index
    });
  }

  function closeUnlockContainer() {
    return setUnlockContainer(undefined);
  }

  return {
    closeUnlockContainer,
    handleUnlockContainer,
    handleUnlockContainerSelect,
    unlockContainer
  };
}
