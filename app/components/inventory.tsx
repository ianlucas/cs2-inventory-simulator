/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS_hasNametag,
  CS_Item,
  CS_NAMETAG_TOOL_DEF,
  CS_resolveItemImage,
  CS_Team
} from "@ianlucas/cslib";
import { ReactNode, useMemo, useState } from "react";
import { InventoryItem } from "~/components/inventory-item";
import { useSync } from "~/hooks/use-sync";
import { useTranslation } from "~/hooks/use-translation";
import { baseUrl } from "~/utils/economy";
import {
  getFreeItemsToDisplay,
  sortByEquipped,
  sortByName,
  sortByType,
  transform
} from "~/utils/inventory";
import { CaseOpening } from "./case-opening";
import { RenameItem } from "./rename-item";
import { useRootContext } from "./root-context";
import {
  EquipAction,
  RemoveAction,
  UnequipAction
} from "~/routes/api.action.sync._index";

export function Inventory() {
  const { inventory, setInventory, language } = useRootContext();
  const translate = useTranslation();
  const sync = useSync();

  const items = useMemo(
    () => [
      // Inventory Items
      ...inventory
        .getAll()
        .map(transform)
        .sort(sortByName)
        .sort(sortByType)
        .sort(sortByEquipped),
      // Default Game Items
      ...getFreeItemsToDisplay()
        .sort(sortByName)
        .sort(sortByType)
        .sort(sortByEquipped)
    ],
    [inventory, language]
  );

  const [useItemAction, setUseItemAction] = useState<{
    item: CS_Item;
    index: number;
    items: typeof items;
  }>();
  const [unlockCase, setUnlockCase] = useState<{
    caseIndex: number;
    caseItem: CS_Item;
    keyIndex?: number;
  }>();
  const [renameItem, setRenameItem] = useState<{
    toolIndex: number;
    targetItem: CS_Item;
    targetIndex: number;
  }>();
  const isSelectAItem = useItemAction !== undefined;
  const isUnlockingCase = unlockCase !== undefined;
  const isRenamingItem = renameItem !== undefined;

  function handleEquip(index: number, team?: CS_Team) {
    setInventory((inventory) => inventory.equip(index, team));
    sync(EquipAction, { index, team });
  }

  function handleUnequip(index: number, team?: CS_Team) {
    setInventory((inventory) => inventory.unequip(index, team));
    sync(UnequipAction, { index, team });
  }

  function handleRemove(index: number) {
    setInventory((inventory) => inventory.remove(index));
    sync(RemoveAction, { index });
  }

  function handleUnlockContainer(index: number, useItem: CS_Item) {
    if (useItem.keys || useItem.type === "key") {
      return setUseItemAction({
        item: useItem,
        index,
        items: items.filter(
          (item) =>
            (useItem.type === "key" && item?.item.keys?.includes(useItem.id)) ||
            (useItem.type === "case" && useItem.keys?.includes(item.item.id))
        )
      });
    }
    if (useItem.type === "case") {
      return setUnlockCase({
        caseIndex: index,
        caseItem: useItem
      });
    }
  }

  function handleRename(index: number, useItem: CS_Item) {
    return setUseItemAction({
      item: useItem,
      index,
      items: items.filter((item) => CS_hasNametag(item.item))
    });
  }

  function dismissUseItem() {
    setUseItemAction(undefined);
  }

  function handleSelectItem(index: number, selectedItem: CS_Item) {
    if (useItemAction) {
      dismissUseItem();
      if (["case", "key"].includes(useItemAction.item.type)) {
        return setUnlockCase({
          caseItem:
            selectedItem.type === "case" ? selectedItem : useItemAction.item,
          caseIndex: selectedItem.type === "case" ? index : useItemAction.index,
          keyIndex: selectedItem.type === "key" ? index : useItemAction.index
        });
      }
      if (
        useItemAction.item.type === "tool" &&
        useItemAction.item.def === CS_NAMETAG_TOOL_DEF
      ) {
        setRenameItem({
          targetIndex: index,
          targetItem: selectedItem,
          toolIndex: useItemAction.index
        });
      }
    }
  }

  function dismissUnlockCase() {
    setUnlockCase(undefined);
  }

  function dismissRenameItem() {
    setRenameItem(undefined);
  }

  return (
    <>
      {isSelectAItem && (
        <div className="m-auto w-full px-4 pb-4 text-xs drop-shadow lg:flex lg:w-[1024px] lg:items-center lg:px-0 lg:pb-0 lg:text-base">
          <button
            className="px-2 py-1 hover:bg-black/30 active:bg-black/70"
            onClick={dismissUseItem}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="h-5" />
          </button>
          <div className="flex flex-1 select-none items-center justify-center gap-3">
            <strong>{translate("InventorySelectAnItem")}</strong>
            <img
              draggable={false}
              className="h-8"
              src={CS_resolveItemImage(baseUrl, useItemAction.item)}
            />
            <span className="text-neutral-300">{useItemAction.item.name}</span>
          </div>
        </div>
      )}
      <div className="m-auto grid w-full select-none grid-cols-2 gap-2 px-2 md:grid-cols-4 lg:my-8 lg:w-[1024px] lg:grid-cols-6 lg:gap-5 lg:px-0">
        {isSelectAItem
          ? useItemAction.items.map((item) => (
              <InventoryItemWrapper key={item.index}>
                <InventoryItem
                  {...item}
                  disableContextMenu
                  onClick={handleSelectItem}
                />
              </InventoryItemWrapper>
            ))
          : items.map((item) => (
              <InventoryItemWrapper key={item.index}>
                <InventoryItem
                  {...item}
                  disableContextMenu={isUnlockingCase}
                  disableHover={isUnlockingCase}
                  onEquip={handleEquip}
                  onRemove={handleRemove}
                  onRename={handleRename}
                  onUnequip={handleUnequip}
                  onUnlockContainer={handleUnlockContainer}
                />
              </InventoryItemWrapper>
            ))}
      </div>
      {isUnlockingCase && (
        <CaseOpening {...unlockCase} onClose={dismissUnlockCase} />
      )}
      {isRenamingItem && (
        <RenameItem {...renameItem} onClose={dismissRenameItem} />
      )}
    </>
  );
}

function InventoryItemWrapper({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="flex h-full w-full items-center justify-center lg:block lg:h-auto lg:w-auto">
        {children}
      </div>
    </div>
  );
}
