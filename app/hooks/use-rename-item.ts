/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Item, CS_hasNametag } from "@ianlucas/cslib";
import { useState } from "react";
import { useItemSelectorContext } from "~/components/item-selector-context";
import { useRootContext } from "~/components/root-context";

export function useRenameItem() {
  const { items, nametagDefaultAllowed } = useRootContext();
  const { itemSelector, setItemSelector } = useItemSelectorContext();
  const [renameItem, setRenameItem] = useState<{
    toolIndex: number;
    targetItem: CS_Item;
    targetIndex: number;
  }>();

  function handleRenameItem(index: number) {
    return setItemSelector({
      index,
      items: items.filter(
        ({ item }) =>
          CS_hasNametag(item) &&
          (!item.free ||
            nametagDefaultAllowed.length === 0 ||
            nametagDefaultAllowed.includes(item.id))
      ),
      type: "rename-item"
    });
  }

  function handleRenameItemSelect(index: number, item: CS_Item) {
    return setRenameItem({
      targetIndex: index,
      targetItem: item,
      toolIndex: itemSelector!.index
    });
  }

  function closeRenameItem() {
    return setRenameItem(undefined);
  }

  return {
    closeRenameItem,
    handleRenameItem,
    handleRenameItemSelect,
    renameItem
  };
}
