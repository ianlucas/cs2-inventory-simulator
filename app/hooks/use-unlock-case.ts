/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useState } from "react";
import { useItemSelectorContext } from "~/components/item-selector-context";
import { useRootContext } from "~/components/root-context";

export function useUnlockCase() {
  const { inventory, items } = useRootContext();
  const { itemSelector, setItemSelector } = useItemSelectorContext();
  const [unlockCase, setUnlockCase] = useState<{
    caseIndex: number;
    keyIndex?: number;
  }>();

  function handleUnlockCase(index: number) {
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
        type: "unlock-case"
      });
    }
    if (selectedItem.type === "case") {
      return setUnlockCase({
        caseIndex: index
      });
    }
  }

  function handleUnlockCaseSelect(index: number) {
    const selectedItem = inventory.getItem(index);
    return setUnlockCase({
      caseIndex: selectedItem.type === "case" ? index : itemSelector!.index,
      keyIndex: selectedItem.type === "key" ? index : itemSelector!.index
    });
  }

  function closeUnlockCase() {
    return setUnlockCase(undefined);
  }

  function isUnlockingCase(
    state: typeof unlockCase
  ): state is NonNullable<typeof unlockCase> {
    return state !== undefined;
  }

  return {
    closeUnlockCase,
    handleUnlockCase,
    handleUnlockCaseSelect,
    isUnlockingCase,
    unlockCase
  };
}
