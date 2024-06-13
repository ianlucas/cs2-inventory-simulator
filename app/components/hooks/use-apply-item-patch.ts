/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2_MAX_PATCHES, assert } from "@ianlucas/cs2-lib";
import { useState } from "react";
import { useInventory, useInventoryItems } from "~/components/app-context";
import { useItemSelector } from "~/components/item-selector-context";

export function useApplyItemPatch() {
  const items = useInventoryItems();
  const [inventory] = useInventory();
  const [itemSelector, setItemSelector] = useItemSelector();
  const [applyItemPatch, setApplyItemPatch] = useState<{
    targetUid: number;
    patchUid: number;
  }>();

  function handleApplyItemPatch(uid: number) {
    const selectedItem = inventory.get(uid);
    return setItemSelector({
      uid,
      items: items.filter(({ item }) =>
        selectedItem.isPatch()
          ? item.hasPatches() && item.getPatchesCount() < CS2_MAX_PATCHES
          : selectedItem.getPatchesCount() < CS2_MAX_PATCHES && item.isPatch()
      ),
      type: "apply-item-patch"
    });
  }

  function handleApplyItemPatchSelect(uid: number) {
    assert(itemSelector !== undefined);
    const isPatch = inventory.get(uid).isPatch();
    return setApplyItemPatch({
      targetUid: !isPatch ? uid : itemSelector.uid,
      patchUid: isPatch ? uid : itemSelector.uid
    });
  }

  function closeApplyItemPatch() {
    return setApplyItemPatch(undefined);
  }

  function isApplyingItemPatch(
    state: typeof applyItemPatch
  ): state is NonNullable<typeof applyItemPatch> {
    return state !== undefined;
  }

  return {
    applyItemPatch,
    closeApplyItemPatch,
    handleApplyItemPatch,
    handleApplyItemPatchSelect,
    isApplyingItemPatch
  };
}
