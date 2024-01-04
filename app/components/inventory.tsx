/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_hasStickers, CS_Item, CS_Team } from "@ianlucas/cslib";
import { ReactNode } from "react";
import { InventoryItem } from "~/components/inventory-item";
import { useApplySticker } from "~/hooks/use-apply-sticker";
import { useRenameItem } from "~/hooks/use-rename-item";
import { useScrapeSticker } from "~/hooks/use-scrape-sticker";
import { useSwapItemsStatTrak } from "~/hooks/use-swap-items-stattrak";
import { useSync } from "~/hooks/use-sync";
import { useUnlockContainer } from "~/hooks/use-unlock-container";
import {
  EquipAction,
  RemoveAction,
  UnequipAction
} from "~/routes/api.action.sync._index";
import { ApplySticker } from "./apply-sticker";
import { CaseOpening } from "./case-opening";
import { InventorySelectedItem } from "./inventory-selected-item";
import { useItemSelectorContext } from "./item-selector-context";
import { RenameItem } from "./rename-item";
import { useRootContext } from "./root-context";
import { ScrapeSticker } from "./scrape-sticker";
import { SwapItemsStatTrak } from "./swap-items-stattrak";

export function Inventory() {
  const sync = useSync();
  const { inventory, items, setInventory } = useRootContext();
  const { itemSelector, setItemSelector } = useItemSelectorContext();

  const ownApplicableStickers =
    items.filter(({ item }) => item.type === "sticker").length > 0 &&
    items.filter(({ item }) => CS_hasStickers(item)).length > 0;

  const {
    closeUnlockContainer,
    handleUnlockContainer,
    handleUnlockContainerSelect,
    unlockContainer
  } = useUnlockContainer();

  const {
    closeRenameItem,
    handleRenameItem,
    handleRenameItemSelect,
    renameItem
  } = useRenameItem();

  const {
    applySticker,
    closeApplySticker,
    handleApplySticker,
    handleApplyStickerSelect
  } = useApplySticker();

  const { closeScrapeSticker, handleScrapeSticker, scrapeSticker } =
    useScrapeSticker();

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
    closeUnlockContainer();
    closeSwapItemsStatTrak();
    closeRenameItem();
    closeApplySticker();
    closeScrapeSticker();
  }

  function handleSelectItem(index: number, item: CS_Item) {
    if (itemSelector !== undefined) {
      const { type } = itemSelector;
      setItemSelector(undefined);
      switch (type) {
        case "case-opening":
          return handleUnlockContainerSelect(index);
        case "swap-items-stattrak":
          return handleSwapItemsStatTrakSelect(index);
        case "rename-item":
          return handleRenameItemSelect(index, item);
        case "apply-sticker":
          return handleApplyStickerSelect(index);
      }
    }
  }

  const isSelectingAnItem = itemSelector !== undefined;
  const isSwapingItemsStatTrak = swapItemsStatTrak?.toIndex !== undefined;
  const isUnlockingContainer = unlockContainer !== undefined;
  const isRenamingItem = renameItem !== undefined;
  const isApplyingSticker = applySticker !== undefined;
  const isScrapingSticker = scrapeSticker !== undefined;

  return (
    <>
      {isSelectingAnItem && (
        <InventorySelectedItem
          {...itemSelector}
          onDismiss={dismissSelectItem}
        />
      )}
      <div className="m-auto grid w-full select-none grid-cols-2 gap-2 px-2 md:grid-cols-4 lg:my-8 lg:w-[1024px] lg:grid-cols-6 lg:gap-5 lg:px-0">
        {isSelectingAnItem
          ? itemSelector.items.map((item) => (
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
                  onApplySticker={handleApplySticker}
                  onEquip={handleEquip}
                  onRemove={handleRemove}
                  onRename={handleRenameItem}
                  onScrapeSticker={handleScrapeSticker}
                  onSwapItemsStatTrak={handleSwapItemsStatTrak}
                  onUnequip={handleUnequip}
                  onUnlockContainer={handleUnlockContainer}
                  ownApplicableStickers={ownApplicableStickers}
                />
              </InventoryItemWrapper>
            ))}
      </div>
      {isUnlockingContainer && (
        <CaseOpening {...unlockContainer} onClose={closeUnlockContainer} />
      )}
      {isRenamingItem && (
        <RenameItem {...renameItem} onClose={closeRenameItem} />
      )}
      {isApplyingSticker && (
        <ApplySticker {...applySticker} onClose={closeApplySticker} />
      )}
      {isScrapingSticker && (
        <ScrapeSticker {...scrapeSticker} onClose={closeScrapeSticker} />
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

function InventoryItemWrapper({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="flex h-full w-full items-center justify-center lg:block lg:h-auto lg:w-auto">
        {children}
      </div>
    </div>
  );
}
