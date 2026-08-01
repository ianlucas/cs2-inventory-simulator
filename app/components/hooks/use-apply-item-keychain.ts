/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { assert } from "@ianlucas/cs2-lib";
import { useState } from "react";
import {
  useInventory,
  useInventoryItems,
  useRules
} from "~/components/app-context";
import { useItemSelector } from "~/components/item-selector-context";
import { isViewerItemSupported } from "~/data/viewer";

export function useApplyItemKeychain() {
  const items = useInventoryItems();
  const { viewerCatalog } = useRules();
  const [inventory] = useInventory();
  const [itemSelector, setItemSelector] = useItemSelector();
  const [applyItemKeychain, setApplyItemKeychain] = useState<{
    targetUid: number;
    keychainUid: number;
  }>();

  function handleApplyItemKeychain(uid: number) {
    const selectedItem = inventory.get(uid);
    return setItemSelector({
      uid,
      items: items.filter(
        ({ item }) =>
          (selectedItem.isKeychain()
            ? item.hasKeychains() && item.getKeychainsCount() === 0
            : selectedItem.getKeychainsCount() === 0 && item.isKeychain()) &&
          isViewerItemSupported(viewerCatalog, item)
      ),
      type: "apply-item-keychain"
    });
  }

  function handleApplyItemKeychainSelect(uid: number) {
    assert(itemSelector !== undefined);
    const isKeychain = uid >= 0 ? inventory.get(uid).isKeychain() : false;
    return setApplyItemKeychain({
      targetUid: !isKeychain ? uid : itemSelector.uid,
      keychainUid: isKeychain ? uid : itemSelector.uid
    });
  }

  function closeApplyItemKeychain() {
    return setApplyItemKeychain(undefined);
  }

  function isApplyingItemKeychain(
    state: typeof applyItemKeychain
  ): state is NonNullable<typeof applyItemKeychain> {
    return state !== undefined;
  }

  return {
    applyItemKeychain,
    closeApplyItemKeychain,
    handleApplyItemKeychain,
    handleApplyItemKeychainSelect,
    isApplyingItemKeychain
  };
}
