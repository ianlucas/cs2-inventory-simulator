/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2ItemType, CS2TeamValues } from "@ianlucas/cs2-lib";
import { useNavigate } from "@remix-run/react";
import { useApplyItemSticker } from "~/components/hooks/use-apply-item-sticker";
import { useInspectItem } from "~/components/hooks/use-inspect-item";
import { useRenameItem } from "~/components/hooks/use-rename-item";
import { useScrapeItemSticker } from "~/components/hooks/use-scrape-item-sticker";
import { useStorageUnit } from "~/components/hooks/use-storage-unit";
import { useSwapItemsStatTrak } from "~/components/hooks/use-swap-items-stattrak";
import { useSync } from "~/components/hooks/use-sync";
import { useUnlockCase } from "~/components/hooks/use-unlock-case";
import { InventoryItem } from "~/components/inventory-item";
import {
  EquipAction,
  RemoveAction,
  UnequipAction
} from "~/routes/api.action.sync._index";
import { playSound } from "~/utils/sound";
import {
  useInventory,
  useInventoryFilter,
  useInventoryItems,
  useLocalize,
  usePreferences
} from "./app-context";
import { ApplyItemSticker } from "./apply-item-sticker";
import { useListenAppEvent } from "./hooks/use-listen-app-event";
import { InfoIcon } from "./info-icon";
import { InspectItem } from "./inspect-item";
import { InventoryGridPlaceholder } from "./inventory-grid-placeholder";
import { InventorySelectedItem } from "./inventory-selected-item";
import { useItemSelector } from "./item-selector-context";
import { RenameItem } from "./rename-item";
import { RenameStorageUnit } from "./rename-storage-unit";
import { ScrapeItemSticker } from "./scrape-item-sticker";
import { SwapItemsStatTrak } from "./swap-items-stattrak";
import { UnlockCase } from "./unlock-case";

export function Inventory() {
  const localize = useLocalize();
  const sync = useSync();
  const items = useInventoryItems();
  const { filterItems } = useInventoryFilter();
  const { hideFilters } = usePreferences();
  const [inventory, setInventory] = useInventory();
  const [itemSelector, setItemSelector] = useItemSelector();
  const navigate = useNavigate();

  const ownApplicableStickers =
    items.filter(({ item }) => item.isSticker()).length > 0 &&
    items.filter(({ item }) => item.hasStickers()).length > 0;

  const {
    closeUnlockCase,
    handleUnlockCase,
    handleUnlockCaseEvent,
    handleUnlockCaseSelect,
    isUnlockingCase,
    unlockCase,
    unlockCaseKey
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
    handleInspectStorageUnit,
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

  const { closeInspectItem, handleInspectItem, inspectItem, isInspectingItem } =
    useInspectItem();

  function handleEquip(uid: number, team?: CS2TeamValues) {
    playSound(
      inventory.get(uid).type === CS2ItemType.MusicKit
        ? "music_equip"
        : "inventory_item_pickup"
    );
    setInventory(inventory.equip(uid, team));
    sync({ type: EquipAction, uid: uid, team });
  }

  function handleUnequip(uid: number, team?: CS2TeamValues) {
    playSound("inventory_item_close");
    setInventory(inventory.unequip(uid, team));
    sync({ type: UnequipAction, uid: uid, team });
  }

  function handleRemove(uid: number) {
    playSound("inventory_item_close");
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
    closeInspectItem();
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

  useListenAppEvent("unlockcase", handleUnlockCaseEvent);

  const isSelectingAnItem = itemSelector !== undefined;
  const displayedItems = isSelectingAnItem
    ? itemSelector.items
    : hideFilters
      ? items
      : items.filter(filterItems);

  return (
    <>
      {isSelectingAnItem && (
        <InventorySelectedItem
          {...itemSelector}
          onDismiss={dismissSelectItem}
        />
      )}
      <div className="m-auto grid w-full select-none px-2 [grid-gap:1em] [grid-template-columns:repeat(auto-fit,minmax(154px,1fr))] lg:my-8 lg:w-[1024px] lg:px-0">
        {displayedItems.map((item) => (
          <div key={item.uid} className="flex items-start justify-center">
            <InventoryItem
              {...item}
              {...(isSelectingAnItem
                ? {
                    disableContextMenu: true,
                    onClick: itemSelector?.readOnly
                      ? undefined
                      : handleSelectItem
                  }
                : {
                    onApplySticker: handleApplyItemSticker,
                    onDepositToStorageUnit: handleDepositToStorageUnit,
                    onEdit: handleEdit,
                    onEquip: handleEquip,
                    onInspectItem: handleInspectItem,
                    onInspectStorageUnit: handleInspectStorageUnit,
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
        ))}
        <InventoryGridPlaceholder />
      </div>
      {displayedItems.length === 0 && (
        <div className="m-auto flex select-none justify-center lg:w-[1024px]">
          <div className="flex w-full items-center justify-center gap-2 bg-gradient-to-r from-transparent via-black/30 to-transparent py-1">
            <InfoIcon className="h-4" />
            {localize("InventoryNoItemsToDisplay")}
          </div>
        </div>
      )}
      {isUnlockingCase(unlockCase) && (
        <UnlockCase
          {...unlockCase}
          key={unlockCaseKey}
          onClose={closeUnlockCase}
        />
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
      {isInspectingItem(inspectItem) && (
        <InspectItem {...inspectItem} onClose={closeInspectItem} />
      )}
    </>
  );
}
