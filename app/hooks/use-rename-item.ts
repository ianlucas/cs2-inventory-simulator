/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Economy } from "@ianlucas/cs2-lib";
import { useState } from "react";
import { useInventoryItems } from "~/components/app-context";
import { useItemSelectorContext } from "~/components/item-selector-context";

export function useRenameItem() {
  const items = useInventoryItems();
  const { itemSelector, setItemSelector } = useItemSelectorContext();
  const [renameItem, setRenameItem] = useState<{
    toolUid: number;
    targetUid: number;
  }>();

  function handleRenameItem(uid: number) {
    return setItemSelector({
      uid,
      items: items.filter(
        ({ item }) =>
          CS_Economy.hasNametag(item.data) &&
          !CS_Economy.isStorageUnitTool(item.data)
      ),
      type: "rename-item"
    });
  }

  function handleRenameItemSelect(uid: number) {
    return setRenameItem({
      targetUid: uid,
      toolUid: itemSelector!.uid
    });
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
