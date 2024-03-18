/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

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
  const { env, items, inventory, setInventory } = useRootContext();
  const [renameStorageUnit, setRenameStorageUnit] = useState<{
    uid: number;
  }>();

  const isDepositableItem = ({
    item,
    inventoryItem: { nametag }
  }: (typeof items)[number]) =>
    (!item.free ||
      (env.nametagDefaultAllowed.includes(item.id) && nametag !== undefined)) &&
    item.type !== "tool";

  function handleRenameStorageUnit(uid: number) {
    return setRenameStorageUnit({ uid });
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
    const canDepositItems = inventory
      .depositToStorageUnit(itemSelector.uid, depositUids)
      .canDepositToStorageUnit(itemSelector.uid);
    setInventory(inventory);
    return setItemSelector(
      canDepositItems
        ? {
            ...itemSelector,
            items: itemSelector.items.filter(
              ({ uid: otherUid }) => otherUid !== uid
            )
          }
        : undefined
    );
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
    const canRetrieveItems = !inventory
      .retrieveFromStorageUnit(itemSelector.uid, retrieveUids)
      .full();
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
    handleRenameStorageUnit,
    handleRetrieveFromStorageUnit,
    handleRetrieveFromStorageUnitSelect,
    isRenamingStorageUnit,
    renameStorageUnit
  };
}
