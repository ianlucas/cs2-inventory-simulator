/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_hasStickers, CS_Item, CS_Team } from "@ianlucas/cslib";
import { InventoryItem } from "~/components/inventory-item";
import { useApplyItemSticker } from "~/hooks/use-apply-item-sticker";
import { useRenameItem } from "~/hooks/use-rename-item";
import { useScrapeItemSticker } from "~/hooks/use-scrape-item-sticker";
import { useSwapItemsStatTrak } from "~/hooks/use-swap-items-stattrak";
import { useSync } from "~/hooks/use-sync";
import { useUnlockCase } from "~/hooks/use-unlock-case";
import {
  EquipAction,
  RemoveAction,
  UnequipAction
} from "~/routes/api.action.sync._index";
import { ApplyItemSticker } from "./apply-item-sticker";
import { InventorySelectedItem } from "./inventory-selected-item";
import { useItemSelectorContext } from "./item-selector-context";
import { RenameItem } from "./rename-item";
import { useRootContext } from "./root-context";
import { ScrapeItemSticker } from "./scrape-item-sticker";
import { SwapItemsStatTrak } from "./swap-items-stattrak";
import { UnlockCase } from "./unlock-case";
import { useStorageUnit } from "~/hooks/use-storage-unit";
import { RenameStorageUnit } from "./rename-storage-unit";
import { useNavigate } from "@remix-run/react";

export function Inventory() {
  const sync = useSync();
  const { inventory, items, setInventory } = useRootContext();
  const { itemSelector, setItemSelector } = useItemSelectorContext();
  const navigate = useNavigate();

  const ownApplicableStickers =
    items.filter(({ item }) => item.type === "sticker").length > 0 &&
    items.filter(({ item }) => CS_hasStickers(item)).length > 0;

  const {
    closeUnlockCase,
    handleUnlockCase,
    handleUnlockCaseSelect,
    isUnlockingCase,
    unlockCase
  } = useUnlockCase();

  const {
    closeRenameItem,
    handleRenameItem,
    handleRenameItemSelect,
    isRenamingItem,
    renameItem
  } = useRenameItem();

  const {
    closeRenameStorageUnit,
    handleDepositToStorageUnit,
    handleDepositToStorageUnitSelect,
    handleRenameStorageUnit,
    handleRetrieveFromStorageUnit,
    handleRetrieveFromStorageUnitSelect,
    isRenamingStorageUnit,
    renameStorageUnit
  } = useStorageUnit();

  const {
    applyItemSticker,
    closeApplyItemSticker,
    handleApplyItemSticker,
    handleApplyItemStickerSelect,
    isApplyingItemSticker
  } = useApplyItemSticker();

  const {
    closeScrapeItemSticker,
    handleScrapeItemSticker,
    isScrapingItemSticker,
    scrapeItemSticker
  } = useScrapeItemSticker();

  const {
    closeSwapItemsStatTrak,
    handleSwapItemsStatTrak,
    handleSwapItemsStatTrakSelect,
    isSwapingItemsStatTrak,
    swapItemsStatTrak
  } = useSwapItemsStatTrak();

  function handleEquip(uid: number, team?: CS_Team) {
    setInventory(inventory.equip(uid, team));
    sync({ type: EquipAction, uid: uid, team });
  }

  function handleUnequip(uid: number, team?: CS_Team) {
    setInventory(inventory.unequip(uid, team));
    sync({ type: UnequipAction, uid: uid, team });
  }

  function handleRemove(uid: number) {
    setInventory(inventory.remove(uid));
    sync({ type: RemoveAction, uid: uid });
  }

  function handleEdit(uid: number) {
    return navigate(`/craft?uid=${uid}`);
  }

  function dismissSelectItem() {
    setItemSelector(undefined);
    closeUnlockCase();
    closeSwapItemsStatTrak();
    closeRenameItem();
    closeRenameStorageUnit();
    closeApplyItemSticker();
    closeScrapeItemSticker();
  }

  function handleSelectItem(uid: number) {
    if (itemSelector !== undefined) {
      const { type } = itemSelector;

      switch (type) {
        case "unlock-case":
          setItemSelector(undefined);
          return handleUnlockCaseSelect(uid);
        case "swap-items-stattrak":
          setItemSelector(undefined);
          return handleSwapItemsStatTrakSelect(uid);
        case "rename-item":
          setItemSelector(undefined);
          return handleRenameItemSelect(uid);
        case "apply-item-sticker":
          setItemSelector(undefined);
          return handleApplyItemStickerSelect(uid);
        case "deposit-to-storage-unit":
          return handleDepositToStorageUnitSelect(uid);
        case "retrieve-from-storage-unit":
          return handleRetrieveFromStorageUnitSelect(uid);
      }
    }
  }

  const isSelectingAnItem = itemSelector !== undefined;

  return (
    <>
      {isSelectingAnItem && (
        <InventorySelectedItem
          {...itemSelector}
          onDismiss={dismissSelectItem}
        />
      )}
      <div className="m-auto grid w-full select-none grid-cols-2 gap-2 px-2 md:grid-cols-4 lg:my-8 lg:w-[1024px] lg:grid-cols-6 lg:gap-5 lg:px-0">
        {(isSelectingAnItem ? itemSelector.items : items).map((item) => (
          <div key={item.uid}>
            <div className="flex h-full w-full items-center justify-center lg:block lg:h-auto lg:w-auto">
              <InventoryItem
                {...item}
                {...(isSelectingAnItem
                  ? {
                      disableContextMenu: true,
                      onClick: handleSelectItem
                    }
                  : {
                      onApplySticker: handleApplyItemSticker,
                      onDepositToStorageUnit: handleDepositToStorageUnit,
                      onEdit: handleEdit,
                      onEquip: handleEquip,
                      onRemove: handleRemove,
                      onRename: handleRenameItem,
                      onRenameStorageUnit: handleRenameStorageUnit,
                      onRetrieveFromStorageUnit: handleRetrieveFromStorageUnit,
                      onScrapeSticker: handleScrapeItemSticker,
                      onSwapItemsStatTrak: handleSwapItemsStatTrak,
                      onUnequip: handleUnequip,
                      onUnlockContainer: handleUnlockCase,
                      ownApplicableStickers: ownApplicableStickers
                    })}
              />
            </div>
          </div>
        ))}
      </div>
      {isUnlockingCase(unlockCase) && (
        <UnlockCase {...unlockCase} onClose={closeUnlockCase} />
      )}
      {isRenamingItem(renameItem) && (
        <RenameItem {...renameItem} onClose={closeRenameItem} />
      )}
      {isRenamingStorageUnit(renameStorageUnit) && (
        <RenameStorageUnit
          {...renameStorageUnit}
          onClose={closeRenameStorageUnit}
        />
      )}
      {isApplyingItemSticker(applyItemSticker) && (
        <ApplyItemSticker
          {...applyItemSticker}
          onClose={closeApplyItemSticker}
        />
      )}
      {isScrapingItemSticker(scrapeItemSticker) && (
        <ScrapeItemSticker
          {...scrapeItemSticker}
          onClose={closeScrapeItemSticker}
        />
      )}
      {isSwapingItemsStatTrak(swapItemsStatTrak) && (
        <SwapItemsStatTrak
          {...swapItemsStatTrak}
          onClose={closeSwapItemsStatTrak}
        />
      )}
    </>
  );
}
