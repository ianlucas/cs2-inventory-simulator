/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useState } from "react";
import { useInventoryItems } from "~/components/app-context";
import { useItemSelector } from "~/components/item-selector-context";

export function useRenameItem() {
  const items = useInventoryItems();
  const [itemSelector, setItemSelector] = useItemSelector();
  const [renameItem, setRenameItem] = useState<{
    toolUid: number;
    targetUid: number;
  }>();

  function handleRenameItem(uid: number) {
    return setItemSelector({
      uid,
      items: items.filter(
        ({ item }) => item.hasNametag() && !item.isStorageUnit()
      ),
      type: "rename-item"
    });
  }

  function handleRenameItemSelect(uid: number) {
    if (itemSelector !== undefined) {
      return setRenameItem({
        targetUid: uid,
        toolUid: itemSelector.uid
      });
    }
  }

  function closeRenameItem() {
    return setRenameItem(undefined);
  }

  function isRenamingItem(
    state: typeof renameItem
  ): state is NonNullable<typeof renameItem> {
    return state !== undefined;
  }

  return {
    closeRenameItem,
    handleRenameItem,
    handleRenameItemSelect,
    isRenamingItem,
    renameItem
  };
}
