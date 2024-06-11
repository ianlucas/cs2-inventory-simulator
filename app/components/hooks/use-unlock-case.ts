/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { assert } from "@ianlucas/cs2-lib";
import { useState } from "react";
import { useInventory, useInventoryItems } from "~/components/app-context";
import { useItemSelector } from "~/components/item-selector-context";
import { playSound } from "~/utils/sound";

export function useUnlockCase() {
  const [inventory] = useInventory();
  const items = useInventoryItems();
  const [itemSelector, setItemSelector] = useItemSelector();
  const [unlockCase, setUnlockCase] = useState<{
    caseUid: number;
    keyUid?: number;
  }>();

  function handleUnlockCase(uid: number) {
    const selectedItem = inventory.get(uid);
    if (selectedItem.keys !== undefined || selectedItem.isContainerKey()) {
      const keyItems = items.filter(
        ({ item }) =>
          (selectedItem.isContainerKey() &&
            item.keys?.includes(selectedItem.id)) ||
          (selectedItem.isContainer() && selectedItem.keys?.includes(item.id))
      );
      if (selectedItem.isContainer() && keyItems.length === 0) {
        playSound("case_drop");
        return setUnlockCase({
          caseUid: uid
        });
      }
      return setItemSelector({
        uid,
        items: keyItems,
        type: "unlock-case"
      });
    }
    if (selectedItem.isContainer()) {
      playSound("case_drop");
      return setUnlockCase({
        caseUid: uid
      });
    }
  }

  function handleUnlockCaseSelect(uid: number) {
    assert(itemSelector !== undefined);
    playSound("case_drop");
    const selectedItem = inventory.get(uid);
    return setUnlockCase({
      caseUid: selectedItem.isContainer() ? uid : itemSelector.uid,
      keyUid: selectedItem.isContainerKey() ? uid : itemSelector.uid
    });
  }

  function handleUnlockCaseEvent(state: NonNullable<typeof unlockCase>) {
    playSound("case_drop");
    return setUnlockCase(state);
  }

  function closeUnlockCase() {
    return setUnlockCase(undefined);
  }

  function isUnlockingCase(
    state: typeof unlockCase
  ): state is NonNullable<typeof unlockCase> {
    return state !== undefined;
  }

  const unlockCaseKey = `${unlockCase?.caseUid}:${unlockCase?.keyUid}`;

  return {
    closeUnlockCase,
    handleUnlockCase,
    handleUnlockCaseEvent,
    handleUnlockCaseSelect,
    isUnlockingCase,
    unlockCase,
    unlockCaseKey
  };
}
