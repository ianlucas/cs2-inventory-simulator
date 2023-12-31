/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS_hasNametag,
  CS_hasStickers,
  CS_Item,
  CS_Team
} from "@ianlucas/cslib";
import { ReactNode, useMemo, useState } from "react";
import { InventoryItem } from "~/components/inventory-item";
import { useSync } from "~/hooks/use-sync";
import { useTranslation } from "~/hooks/use-translation";
import {
  EquipAction,
  RemoveAction,
  UnequipAction
} from "~/routes/api.action.sync._index";
import { resolveItemImage } from "~/utils/economy";
import {
  getFreeItemsToDisplay,
  sortByEquipped,
  sortByName,
  sortByType,
  transform
} from "~/utils/inventory";
import { ApplySticker } from "./apply-sticker";
import { CaseOpening } from "./case-opening";
import { RenameItem } from "./rename-item";
import { useRootContext } from "./root-context";
import { ScrapeSticker } from "./scrape-sticker";

export function Inventory() {
  const {
    inventory,
    setInventory,
    language,
    nametagDefaultAllowed,
    hideFreeItems
  } = useRootContext();
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
      ...getFreeItemsToDisplay(hideFreeItems)
        .sort(sortByName)
        .sort(sortByType)
        .sort(sortByEquipped)
    ],
    [inventory, language, hideFreeItems]
  );

  const ownApplicableStickers =
    items.filter(({ item }) => item.type === "sticker").length > 0 &&
    items.filter(({ item }) => CS_hasStickers(item)).length > 0;

  const [useItemAction, setUseItemAction] = useState<{
    item: CS_Item;
    index: number;
    items: typeof items;
    type: string;
  }>();
  const [unlockCase, setUnlockCase] = useState<{
    caseIndex: number;
    caseItem: CS_Item;
    keyItem?: CS_Item;
    keyIndex?: number;
  }>();
  const [renameItem, setRenameItem] = useState<{
    toolIndex: number;
    targetItem: CS_Item;
    targetIndex: number;
  }>();
  const [applySticker, setApplySticker] = useState<{
    itemIndex: number;
    item: CS_Item;
    stickerItemIndex: number;
    stickerItem: CS_Item;
  }>();
  const [scrapeSticker, setScrapeSticker] = useState<{
    index: number;
    item: CS_Item;
  }>();
  const isSelectAItem = useItemAction !== undefined;
  const isUnlockingCase = unlockCase !== undefined;
  const isRenamingItem = renameItem !== undefined;
  const isApplyingSticker = applySticker !== undefined;
  const isScrapingSticker = scrapeSticker !== undefined;

  function handleEquip(index: number, team?: CS_Team) {
    setInventory(inventory.equip(index, team));
    sync({ type: EquipAction, index, team });
  }

  function handleUnequip(index: number, team?: CS_Team) {
    setInventory(inventory.unequip(index, team));
    sync({ type: UnequipAction, index, team });
  }

  function handleRemove(index: number) {
    setInventory(inventory.remove(index));
    sync({ type: RemoveAction, index });
  }

  function handleUnlockContainer(index: number, useItem: CS_Item) {
    if (useItem.keys || useItem.type === "key") {
      return setUseItemAction({
        index,
        item: useItem,
        items: items.filter(
          ({ item }) =>
            (useItem.type === "key" && item.keys?.includes(useItem.id)) ||
            (useItem.type === "case" && useItem.keys?.includes(item.id))
        ),
        type: "case-opening"
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
      index,
      item: useItem,
      items: items.filter(
        ({ item }) =>
          CS_hasNametag(item) &&
          (!item.free ||
            nametagDefaultAllowed.length === 0 ||
            nametagDefaultAllowed.includes(item.id))
      ),
      type: "rename-item"
    });
  }

  function handleApplySticker(index: number, useItem: CS_Item) {
    return setUseItemAction({
      index,
      item: useItem,
      items: items.filter(
        ({ item }) =>
          !item.free &&
          ((useItem.type === "sticker" && CS_hasStickers(item)) ||
            (useItem.type !== "sticker" && item.type === "sticker"))
      ),
      type: "apply-sticker"
    });
  }

  function handleScrapeSticker(index: number, item: CS_Item) {
    setScrapeSticker({ index, item });
  }

  function dismissUseItem() {
    setUseItemAction(undefined);
  }

  function handleSelectItem(index: number, selectedItem: CS_Item) {
    if (useItemAction) {
      const { type } = useItemAction;
      dismissUseItem();
      switch (type) {
        case "case-opening":
          return setUnlockCase({
            caseItem:
              selectedItem.type === "case" ? selectedItem : useItemAction.item,
            caseIndex:
              selectedItem.type === "case" ? index : useItemAction.index,
            keyIndex: selectedItem.type === "key" ? index : useItemAction.index,
            keyItem:
              selectedItem.type === "key" ? selectedItem : useItemAction.item
          });

        case "rename-item":
          return setRenameItem({
            targetIndex: index,
            targetItem: selectedItem,
            toolIndex: useItemAction.index
          });

        case "apply-sticker":
          return setApplySticker({
            item:
              selectedItem.type !== "sticker"
                ? selectedItem
                : useItemAction.item,
            itemIndex:
              selectedItem.type !== "sticker" ? index : useItemAction.index,
            stickerItem:
              selectedItem.type === "sticker"
                ? selectedItem
                : useItemAction.item,
            stickerItemIndex:
              selectedItem.type === "sticker" ? index : useItemAction.index
          });
      }
    }
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
              src={resolveItemImage(useItemAction.item)}
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
                  onApplySticker={handleApplySticker}
                  onEquip={handleEquip}
                  onRemove={handleRemove}
                  onRename={handleRename}
                  onScrapeSticker={handleScrapeSticker}
                  onUnequip={handleUnequip}
                  onUnlockContainer={handleUnlockContainer}
                  ownApplicableStickers={ownApplicableStickers}
                />
              </InventoryItemWrapper>
            ))}
      </div>
      {isUnlockingCase && (
        <CaseOpening {...unlockCase} onClose={() => setUnlockCase(undefined)} />
      )}
      {isRenamingItem && (
        <RenameItem {...renameItem} onClose={() => setRenameItem(undefined)} />
      )}
      {isApplyingSticker && (
        <ApplySticker
          {...applySticker}
          onClose={() => setApplySticker(undefined)}
        />
      )}
      {isScrapingSticker && (
        <ScrapeSticker
          {...scrapeSticker}
          onClose={() => setScrapeSticker(undefined)}
        />
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
