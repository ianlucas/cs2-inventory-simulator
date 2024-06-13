/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { assert } from "@ianlucas/cs2-lib";
import { useState } from "react";
import { useInventory, useInventoryItems } from "~/components/app-context";
import { useItemSelector } from "~/components/item-selector-context";
import {
  DepositToStorageUnitAction,
  RetrieveFromStorageUnitAction
} from "~/routes/api.action.sync._index";
import { transform } from "~/utils/inventory-transform";
import { useSync } from "./use-sync";

export function useStorageUnit() {
  const sync = useSync();
  const [itemSelector, setItemSelector] = useItemSelector();
  const items = useInventoryItems();
  const [inventory, setInventory] = useInventory();
  const [renameStorageUnit, setRenameStorageUnit] = useState<{
    uid: number;
  }>();

  const isDepositableItem = ({ item }: (typeof items)[number]) =>
    (!item.free || item.nameTag !== undefined || item.stickers !== undefined) &&
    !item.isTool();

  function handleRenameStorageUnit(uid: number) {
    return setRenameStorageUnit({ uid });
  }

  function handleInspectStorageUnit(uid: number) {
    return setItemSelector({
      items: inventory.getStorageUnitItems(uid).map((item) => transform(item)),
      readOnly: true,
      type: "inspect-storage-unit",
      uid
    });
  }

  function handleDepositToStorageUnit(uid: number) {
    return setItemSelector({
      uid: uid,
      items: items.filter(isDepositableItem),
      type: "deposit-to-storage-unit"
    });
  }

  function handleDepositToStorageUnitSelect(uid: number) {
    assert(itemSelector !== undefined);
    const depositUids = [uid];
    sync({
      type: DepositToStorageUnitAction,
      uid: itemSelector.uid,
      depositUids: depositUids
    });
    const canDepositItems = inventory
      .depositToStorageUnit(itemSelector.uid, depositUids)
      .canDepositToStorageUnit(itemSelector.uid);
    setInventory(inventory);
    return setItemSelector(
      canDepositItems
        ? {
            ...itemSelector,
            items: itemSelector.items.filter(({ uid: xuid }) => xuid !== uid)
          }
        : undefined
    );
  }

  function handleRetrieveFromStorageUnit(uid: number) {
    return setItemSelector({
      uid,
      items: inventory.getStorageUnitItems(uid).map((item) => transform(item)),
      type: "retrieve-from-storage-unit"
    });
  }

  function handleRetrieveFromStorageUnitSelect(uid: number) {
    assert(itemSelector !== undefined);
    const retrieveUids = [uid];
    sync({
      type: RetrieveFromStorageUnitAction,
      uid: itemSelector.uid,
      retrieveUids: retrieveUids
    });
    const canRetrieveItems = inventory
      .retrieveFromStorageUnit(itemSelector.uid, retrieveUids)
      .canRetrieveFromStorageUnit(itemSelector.uid);
    setInventory(inventory);
    return setItemSelector(
      canRetrieveItems
        ? {
            ...itemSelector,
            items: itemSelector.items.filter(
              ({ uid: otherUid }) => otherUid !== uid
            )
          }
        : undefined
    );
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
    handleInspectStorageUnit,
    handleRenameStorageUnit,
    handleRetrieveFromStorageUnit,
    handleRetrieveFromStorageUnitSelect,
    isRenamingStorageUnit,
    renameStorageUnit
  };
}
