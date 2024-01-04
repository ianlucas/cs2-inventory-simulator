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

export function Inventory() {
  const sync = useSync();
  const { inventory, items, setInventory } = useRootContext();
  const { itemSelector, setItemSelector } = useItemSelectorContext();

  const ownApplicableStickers =
    items.filter(({ item }) => item.type === "sticker").length > 0 &&
    items.filter(({ item }) => CS_hasStickers(item)).length > 0;

  const {
    closeUnlockCase,
    handleUnlockCase,
    handleUnlockCaseSelect,
    unlockCase
  } = useUnlockCase();

  const {
    closeRenameItem,
    handleRenameItem,
    handleRenameItemSelect,
    renameItem
  } = useRenameItem();

  const {
    applyItemSticker,
    closeApplyItemSticker,
    handleApplyItemSticker,
    handleApplyItemStickerSelect
  } = useApplyItemSticker();

  const { closeScrapeItemSticker, handleScrapeItemSticker, scrapeItemSticker } =
    useScrapeItemSticker();

  const {
    closeSwapItemsStatTrak,
    handleSwapItemsStatTrakSelect,
    handleSwapItemsStatTrak,
    swapItemsStatTrak
  } = useSwapItemsStatTrak();

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

  function dismissSelectItem() {
    setItemSelector(undefined);
    closeUnlockCase();
    closeSwapItemsStatTrak();
    closeRenameItem();
    closeApplyItemSticker();
    closeScrapeItemSticker();
  }

  function handleSelectItem(index: number, item: CS_Item) {
    if (itemSelector !== undefined) {
      const { type } = itemSelector;
      setItemSelector(undefined);
      switch (type) {
        case "unlock-case":
          return handleUnlockCaseSelect(index);
        case "swap-items-stattrak":
          return handleSwapItemsStatTrakSelect(index);
        case "rename-item":
          return handleRenameItemSelect(index, item);
        case "apply-item-sticker":
          return handleApplyItemStickerSelect(index);
      }
    }
  }

  const isSelectingAnItem = itemSelector !== undefined;
  const isSwapingItemsStatTrak = swapItemsStatTrak?.toIndex !== undefined;
  const isUnlockingContainer = unlockCase !== undefined;
  const isRenamingItem = renameItem !== undefined;
  const isApplyingSticker = applyItemSticker !== undefined;
  const isScrapingSticker = scrapeItemSticker !== undefined;

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
          <div key={item.index}>
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
                      onEquip: handleEquip,
                      onRemove: handleRemove,
                      onRename: handleRenameItem,
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
      {isUnlockingContainer && (
        <UnlockCase {...unlockCase} onClose={closeUnlockCase} />
      )}
      {isRenamingItem && (
        <RenameItem {...renameItem} onClose={closeRenameItem} />
      )}
      {isApplyingSticker && (
        <ApplyItemSticker
          {...applyItemSticker}
          onClose={closeApplyItemSticker}
        />
      )}
      {isScrapingSticker && (
        <ScrapeItemSticker
          {...scrapeItemSticker}
          onClose={closeScrapeItemSticker}
        />
      )}
      {isSwapingItemsStatTrak && (
        <SwapItemsStatTrak
          {...(swapItemsStatTrak as any)}
          onClose={closeSwapItemsStatTrak}
        />
      )}
    </>
  );
}
