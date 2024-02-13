/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Item, CS_STORAGE_UNIT_TOOL_DEF } from "@ianlucas/cslib";
import { useState } from "react";
import { useItemSelectorContext } from "~/components/item-selector-context";
import { useRootContext } from "~/components/root-context";
import {
  DepositToStorageUnitAction,
  RetrieveFromStorageUnitAction
} from "~/routes/api.action.sync._index";
import { transform } from "~/utils/inventory";
import { useSync } from "./use-sync";

export function useStorageUnit() {
  const sync = useSync();
  const { itemSelector, setItemSelector } = useItemSelectorContext();
  const { items, inventory, setInventory } = useRootContext();
  const [renameStorageUnit, setRenameStorageUnit] = useState<{
    item: CS_Item;
    uid: number;
  }>();

  const isDepositableItem = ({ item }: (typeof items)[number]) =>
    !item.free &&
    (item.type !== "tool" || item.def !== CS_STORAGE_UNIT_TOOL_DEF);

  function handleRenameStorageUnit(uid: number, item: CS_Item) {
    return setRenameStorageUnit({ item, uid });
  }

  function handleDepositToStorageUnit(uid: number) {
    return setItemSelector({
      uid: uid,
      items: items.filter(isDepositableItem),
      type: "deposit-to-storage-unit"
    });
  }

  function handleDepositToStorageUnitSelect(uid: number) {
    if (itemSelector === undefined) {
      throw new Error("unexpected state when depositing item");
    }
    const depositUids = [uid];
    sync({
      type: DepositToStorageUnitAction,
      uid: itemSelector.uid,
      depositUids: depositUids
    });
    setInventory(inventory.depositToStorageUnit(itemSelector.uid, depositUids));
    return setItemSelector({
      ...itemSelector,
      items: itemSelector.items.filter(({ uid: otherUid }) => otherUid !== uid)
    });
  }

  function handleRetrieveFromStorageUnit(uid: number) {
    return setItemSelector({
      uid,
      items: inventory.getStorageUnitItems(uid).map(transform),
      type: "retrieve-from-storage-unit"
    });
  }

  function handleRetrieveFromStorageUnitSelect(uid: number) {
    if (itemSelector === undefined) {
      throw new Error("unexpected state when retrieving item");
    }
    const retrieveUids = [uid];
    sync({
      type: RetrieveFromStorageUnitAction,
      uid: itemSelector.uid,
      retrieveUids: retrieveUids
    });
    setInventory(
      inventory.retrieveFromStorageUnit(itemSelector.uid, retrieveUids)
    );
    return setItemSelector({
      ...itemSelector,
      items: itemSelector.items.filter(({ uid: otherUid }) => otherUid !== uid)
    });
  }

  function closeRenameStorageUnit() {
    return setRenameStorageUnit(undefined);
  }

  function isRenamingStorageUnit(
    state: typeof renameStorageUnit
  ): state is NonNullable<typeof renameStorageUnit> {
    return state !== undefined;
  }

  return {
    closeRenameStorageUnit,
    handleDepositToStorageUnit,
    handleDepositToStorageUnitSelect,
    handleRenameStorageUnit,
    handleRetrieveFromStorageUnit,
    handleRetrieveFromStorageUnitSelect,
    isRenamingStorageUnit,
    renameStorageUnit
  };
}
