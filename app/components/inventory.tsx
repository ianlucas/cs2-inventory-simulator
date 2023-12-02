/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CS_hasNametag, CS_Item, CS_NAMETAG_TOOL_DEF, CS_resolveItemImage, CS_Team } from "@ianlucas/cslib";
import { ReactNode, useMemo, useState } from "react";
import { InventoryItem } from "~/components/inventory-item";
import { useSync } from "~/hooks/use-sync";
import { useTranslation } from "~/hooks/use-translation";
import { baseUrl } from "~/utils/economy";
import { getFreeItemsToDisplay, sortByEquipped, sortByName, sortByType, transform } from "~/utils/inventory";
import { CaseOpening } from "./case-opening";
import { RenameItem } from "./rename-item";
import { useRootContext } from "./root-context";

export function Inventory() {
  const { inventory, setInventory, language } = useRootContext();
  const translate = useTranslation();
  const sync = useSync();

  const items = useMemo(() => [
    // Inventory Items
    ...inventory.getAll()
      .map(transform)
      .sort(sortByName)
      .sort(sortByType)
      .sort(sortByEquipped),
    // Default Game Items
    ...getFreeItemsToDisplay()
      .sort(sortByName)
      .sort(sortByType)
      .sort(sortByEquipped)
  ], [inventory, language]);

  const [useItemAction, setUseItemAction] = useState<{
    csItem: CS_Item;
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

  function handleEquip(index: number, csTeam?: CS_Team) {
    setInventory(inventory => inventory.equip(index, csTeam));
    sync("equip", { index, csTeam });
  }

  function handleUnequip(index: number, csTeam?: CS_Team) {
    setInventory(inventory => inventory.unequip(index, csTeam));
    sync("unequip", { index, csTeam });
  }

  function handleDelete(index: number) {
    setInventory(inventory => inventory.remove(index));
    sync("remove", { index });
  }

  function handleUnlockContainer(index: number, csItem: CS_Item) {
    if (csItem.keys || csItem.type === "key") {
      return setUseItemAction({
        csItem,
        index,
        items: items.filter((item) =>
          (csItem.type === "key" && item?.csItem.keys?.includes(csItem.id))
          || (csItem.type === "case" && csItem.keys?.includes(item.csItem.id))
        )
      });
    }
    if (csItem.type === "case") {
      return setUnlockCase({
        caseIndex: index,
        caseItem: csItem
      });
    }
  }

  function handleRename(index: number, csItem: CS_Item) {
    return setUseItemAction({
      csItem,
      index,
      items: items.filter(item => CS_hasNametag(item.csItem))
    });
  }

  function dismissUseItem() {
    setUseItemAction(undefined);
  }

  function handleSelectItem(index: number, csItem: CS_Item) {
    if (useItemAction) {
      dismissUseItem();
      if (["case", "key"].includes(useItemAction.csItem.type)) {
        return setUnlockCase({
          caseItem: csItem.type === "case" ? csItem : useItemAction.csItem,
          caseIndex: csItem.type === "case" ? index : useItemAction.index,
          keyIndex: csItem.type === "key" ? index : useItemAction.index
        });
      }
      if (
        useItemAction.csItem.type === "tool"
        && useItemAction.csItem.def === CS_NAMETAG_TOOL_DEF
      ) {
        setRenameItem({
          targetIndex: index,
          targetItem: csItem,
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
        <div className="w-full px-4 lg:px-0 lg:w-[1024px] m-auto text-xs pb-4 lg:pb-0 lg:text-base lg:flex lg:items-center drop-shadow">
          <button
            className="hover:bg-black/30 active:bg-black/70 px-2 py-1"
            onClick={dismissUseItem}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="h-5" />
          </button>
          <div className="flex-1 flex items-center justify-center gap-3 select-none">
            <strong>{translate("InventorySelectAnItem")}</strong>
            <img
              draggable={false}
              className="h-8"
              src={CS_resolveItemImage(baseUrl, useItemAction.csItem)}
            />
            <span className="text-neutral-300">
              {useItemAction.csItem.name}
            </span>
          </div>
        </div>
      )}
      <div className="w-full px-2 lg:px-0 lg:w-[1024px] m-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 lg:my-8 gap-2 lg:gap-5 select-none">
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
          : items.map(item => (
            <InventoryItemWrapper key={item.index}>
              <InventoryItem
                {...item}
                disableContextMenu={isUnlockingCase}
                disableHover={isUnlockingCase}
                onDelete={handleDelete}
                onEquip={handleEquip}
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

function InventoryItemWrapper({
  children
}: {
  children: ReactNode;
}) {
  return (
    <div>
      <div className="w-full h-full flex items-center justify-center lg:w-auto lg:h-auto lg:block">
        {children}
      </div>
    </div>
  );
}
