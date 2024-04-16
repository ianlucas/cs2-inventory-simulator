/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Economy } from "@ianlucas/cs2-lib";
import { useState } from "react";
import { useAppContext } from "~/components/app-context";
import { useItemSelectorContext } from "~/components/item-selector-context";
import { playSound } from "~/utils/sound";

export function useUnlockCase() {
  const { inventory, items } = useAppContext();
  const { itemSelector, setItemSelector } = useItemSelectorContext();
  const [unlockCase, setUnlockCase] = useState<{
    caseUid: number;
    keyUid?: number;
  }>();

  function handleUnlockCase(uid: number) {
    const selectedItem = inventory.get(uid).data;
    if (selectedItem.keys || selectedItem.type === "key") {
      return setItemSelector({
        uid,
        items: items.filter(
          ({ item }) =>
            (CS_Economy.isKey(selectedItem) &&
              item.data.keys?.includes(selectedItem.id)) ||
            (CS_Economy.isCase(selectedItem) &&
              selectedItem.keys?.includes(item.data.id))
        ),
        type: "unlock-case"
      });
    }
    if (selectedItem.type === "case") {
      playSound("case_drop");
      return setUnlockCase({
        caseUid: uid
      });
    }
  }

  function handleUnlockCaseSelect(uid: number) {
    playSound("case_drop");
    const { data: selectedItem } = inventory.get(uid);
    return setUnlockCase({
      caseUid: selectedItem.type === "case" ? uid : itemSelector!.uid,
      keyUid: selectedItem.type === "key" ? uid : itemSelector!.uid
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
