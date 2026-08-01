/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, CS2ItemType, CS2Team } from "@ianlucas/cs2-lib";
import { useNavigate } from "react-router";
import { useApplyItemSticker } from "~/components/hooks/use-apply-item-sticker";
import { useInspectItem } from "~/components/hooks/use-inspect-item";
import { useRenameItem } from "~/components/hooks/use-rename-item";
import { useScrapeItemSticker } from "~/components/hooks/use-scrape-item-sticker";
import { useStorageUnit } from "~/components/hooks/use-storage-unit";
import { useSwapItemsStatTrak } from "~/components/hooks/use-swap-items-stattrak";
import { useSync } from "~/components/hooks/use-sync";
import { useUnlockCase } from "~/components/hooks/use-unlock-case";
import { useUnpackItem } from "~/components/hooks/use-unpack-item";
import { InventoryItem } from "~/components/inventory-item";
import { SyncAction } from "~/data/sync";
import { playSound } from "~/utils/sound";
import {
  useInventory,
  useInventoryFilter,
  useInventoryItems,
  usePreferences,
  useTranslate
} from "./app-context";
import { ApplyItemKeychain } from "./apply-item-keychain";
import { ApplyItemPatch } from "./apply-item-patch";
import { ApplyItemSticker } from "./apply-item-sticker";
import { attachmentName } from "./attachment-3d-drawer";
import { DetachCharm } from "./detach-charm";
import { ExtractItemSticker } from "./extract-item-sticker";
import { useExtractItemSticker } from "./hooks/use-extract-item-sticker";
import { useApplyItemKeychain } from "./hooks/use-apply-item-keychain";
import { useApplyItemPatch } from "./hooks/use-apply-item-patch";
import { useDetachCharm } from "./hooks/use-detach-charm";
import { useListenAppEvent } from "./hooks/use-listen-app-event";
import { useRemoveItemPatch } from "./hooks/use-remove-item-patch";
import { InfoIcon } from "./info-icon";
import { InspectItem } from "./inspect-item";
import { InventoryGridPlaceholder } from "./inventory-grid-placeholder";
import { alert } from "./modal-generic";
import { InventorySelectedItem } from "./inventory-selected-item";
import { useItemSelector } from "./item-selector-context";
import { Presence } from "./presence";
import { RemoveItemPatch } from "./remove-item-patch";
import { RenameItem } from "./rename-item";
import { RenameStorageUnit } from "./rename-storage-unit";
import { ScrapeItemSticker } from "./scrape-item-sticker";
import { SealItemSticker } from "./seal-item-sticker";
import { useSealItemSticker } from "./hooks/use-seal-item-sticker";
import { SwapItemsStatTrak } from "./swap-items-stattrak";
import { UnlockCase } from "./unlock-case";
import { UnpackItem } from "./unpack-item";
import { UnsealGraffiti } from "./unseal-graffiti";
import { useUnsealGraffiti } from "./hooks/use-unseal-graffiti";

export function Inventory() {
  const translate = useTranslate();
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

  const ownApplicableKeychains =
    items.filter(({ item }) => item.isKeychain()).length > 0 &&
    items.filter(({ item }) => item.hasKeychains()).length > 0;

  const ownApplicablePatches =
    items.filter(({ item }) => item.isPatch()).length > 0 &&
    items.filter(({ item }) => item.hasPatches()).length > 0;

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
    applyItemPatch,
    closeApplyItemPatch,
    handleApplyItemPatch,
    handleApplyItemPatchSelect,
    isApplyingItemPatch
  } = useApplyItemPatch();

  const {
    closeRemoveItemPatch,
    handleRemoveItemPatch,
    isRemovingItemPatch,
    removeItemPatch
  } = useRemoveItemPatch();

  const {
    applyItemKeychain,
    closeApplyItemKeychain,
    handleApplyItemKeychain,
    handleApplyItemKeychainSelect,
    isApplyingItemKeychain
  } = useApplyItemKeychain();

  const {
    applyItemSticker,
    closeApplyItemSticker,
    handleApplyItemSticker,
    handleApplyItemStickerSelect,
    isApplyingItemSticker
  } = useApplyItemSticker();

  const {
    closeExtractItemSticker,
    extractItemSticker,
    handleExtractItemSticker,
    isExtractingItemSticker
  } = useExtractItemSticker();

  const {
    closeSealItemSticker,
    handleSealItemSticker,
    handleSealItemStickerCrafted,
    handleSealItemStickerSelect,
    isSealingItemSticker,
    sealItemSticker
  } = useSealItemSticker();

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

  const { closeUnpackItem, handleUnpackItem, isUnpackingItem, unpackItem } =
    useUnpackItem();

  const {
    closeUnsealGraffiti,
    handleUnsealGraffiti,
    isUnsealingGraffiti,
    unsealGraffiti
  } = useUnsealGraffiti();

  const {
    closeDetachCharm,
    detachCharm,
    handleDetachCharm: openDetachCharm,
    isDetachingCharm
  } = useDetachCharm();

  function handleEquip(uid: number, team?: CS2Team) {
    playSound(
      inventory.get(uid).type === CS2ItemType.MusicKit
        ? "music_equip"
        : "inventory_item_pickup"
    );
    setInventory(inventory.equip(uid, team));
    sync({ type: SyncAction.Equip, uid: uid, team });
  }

  function handleUnequip(uid: number, team?: CS2Team) {
    playSound("inventory_item_close");
    setInventory(inventory.unequip(uid, team));
    sync({ type: SyncAction.Unequip, uid: uid, team });
  }

  function handleRemove(uid: number) {
    playSound("inventory_item_close");
    setInventory(inventory.remove(uid));
    sync({ type: SyncAction.Remove, uid: uid });
  }

  function handleEdit(uid: number) {
    return navigate(`/craft?uid=${uid}`, { preventScrollReset: true });
  }

  function handleNeedCharmDetachment() {
    const pack = items.find(
      ({ uid: packUid, item }) => packUid >= 0 && item.isCharmDetachmentPack()
    );
    if (pack !== undefined) {
      return handleUnpackItem(pack.uid);
    }
    return alert({
      titleText: translate("InventoryItemDetachCharm"),
      bodyText: translate(
        "DetachCharmNeed",
        attachmentName(CS2Economy.getCharmDetachment().name)
      ),
      closeText: translate("GenericOK")
    });
  }

  function handleDetachCharm(uid: number) {
    if (inventory.getCharmDetachmentCharges() === 0) {
      return handleNeedCharmDetachment();
    }
    return openDetachCharm(uid);
  }

  function handleDetachCharmWithTool(uid: number) {
    if (inventory.getCharmDetachmentCharges() === 0) {
      return handleNeedCharmDetachment();
    }
    return setItemSelector({
      uid,
      items: items.filter(
        ({ uid: itemUid, item }) => itemUid >= 0 && item.getKeychainsCount() > 0
      ),
      type: "detach-charm"
    });
  }

  function dismissSelectItem() {
    setItemSelector(undefined);
    closeApplyItemKeychain();
    closeApplyItemPatch();
    closeDetachCharm();
    closeApplyItemSticker();
    closeExtractItemSticker();
    closeInspectItem();
    closeRemoveItemPatch();
    closeRenameItem();
    closeRenameStorageUnit();
    closeScrapeItemSticker();
    closeSealItemSticker();
    closeSwapItemsStatTrak();
    closeUnlockCase();
    closeUnpackItem();
    closeUnsealGraffiti();
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
        case "apply-item-keychain":
          setItemSelector(undefined);
          return handleApplyItemKeychainSelect(uid);
        case "apply-item-patch":
          setItemSelector(undefined);
          return handleApplyItemPatchSelect(uid);
        case "apply-item-sticker":
          setItemSelector(undefined);
          return handleApplyItemStickerSelect(uid);
        case "detach-charm":
          setItemSelector(undefined);
          return handleDetachCharm(uid);
        case "seal-item-sticker":
          setItemSelector(undefined);
          return handleSealItemStickerSelect(uid);
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
      <div className="m-auto grid w-full grid-cols-[repeat(auto-fit,minmax(154px,1fr))] px-2 select-none [grid-gap:1em] lg:my-8 lg:w-5xl lg:px-0">
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
                    onApplyPatch: handleApplyItemPatch,
                    onApplySticker: handleApplyItemSticker,
                    onAttachCharm: handleApplyItemKeychain,
                    onDepositToStorageUnit: handleDepositToStorageUnit,
                    onDetachCharm: handleDetachCharm,
                    onDetachCharmWithTool: handleDetachCharmWithTool,
                    onEdit: handleEdit,
                    onEquip: handleEquip,
                    onExtractSticker: handleExtractItemSticker,
                    onInspectItem: handleInspectItem,
                    onInspectStorageUnit: handleInspectStorageUnit,
                    onRemove: handleRemove,
                    onRemovePatch: handleRemoveItemPatch,
                    onRename: handleRenameItem,
                    onRenameStorageUnit: handleRenameStorageUnit,
                    onRetrieveFromStorageUnit: handleRetrieveFromStorageUnit,
                    onScrapeSticker: handleScrapeItemSticker,
                    onSealSticker: handleSealItemSticker,
                    onSwapItemsStatTrak: handleSwapItemsStatTrak,
                    onUnequip: handleUnequip,
                    onUnlockContainer: handleUnlockCase,
                    onUnsealGraffiti: handleUnsealGraffiti,
                    onUseItem: handleUnpackItem,
                    ownApplicableKeychains,
                    ownApplicablePatches,
                    ownApplicableStickers
                  })}
            />
          </div>
        ))}
        <InventoryGridPlaceholder />
      </div>
      {displayedItems.length === 0 && (
        <div className="m-auto flex justify-center select-none lg:w-5xl">
          <div className="flex w-full items-center justify-center gap-2 bg-linear-to-r from-transparent via-black/30 to-transparent py-1">
            <InfoIcon className="h-4" />
            {translate("InventoryNoItemsToDisplay")}
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
      {isApplyingItemPatch(applyItemPatch) && (
        <ApplyItemPatch {...applyItemPatch} onClose={closeApplyItemPatch} />
      )}
      {isRemovingItemPatch(removeItemPatch) && (
        <RemoveItemPatch {...removeItemPatch} onClose={closeRemoveItemPatch} />
      )}
      <Presence present={isApplyingItemKeychain(applyItemKeychain)}>
        {isApplyingItemKeychain(applyItemKeychain) ? (
          <ApplyItemKeychain
            {...applyItemKeychain}
            onClose={closeApplyItemKeychain}
          />
        ) : null}
      </Presence>
      <Presence present={isApplyingItemSticker(applyItemSticker)}>
        {isApplyingItemSticker(applyItemSticker) ? (
          <ApplyItemSticker
            {...applyItemSticker}
            onClose={closeApplyItemSticker}
          />
        ) : null}
      </Presence>
      <Presence present={isExtractingItemSticker(extractItemSticker)}>
        {isExtractingItemSticker(extractItemSticker) ? (
          <ExtractItemSticker
            {...extractItemSticker}
            onClose={closeExtractItemSticker}
          />
        ) : null}
      </Presence>
      <Presence present={isSealingItemSticker(sealItemSticker)}>
        {isSealingItemSticker(sealItemSticker) ? (
          <SealItemSticker
            {...sealItemSticker}
            onAddTool={handleSealItemStickerCrafted}
            onClose={closeSealItemSticker}
          />
        ) : null}
      </Presence>
      <Presence present={isScrapingItemSticker(scrapeItemSticker)}>
        {isScrapingItemSticker(scrapeItemSticker) ? (
          <ScrapeItemSticker
            {...scrapeItemSticker}
            onClose={closeScrapeItemSticker}
          />
        ) : null}
      </Presence>
      {isSwapingItemsStatTrak(swapItemsStatTrak) && (
        <SwapItemsStatTrak
          {...swapItemsStatTrak}
          onClose={closeSwapItemsStatTrak}
        />
      )}
      <Presence present={isInspectingItem(inspectItem)}>
        {isInspectingItem(inspectItem) ? (
          <InspectItem
            {...inspectItem}
            onClose={closeInspectItem}
            onUnsealGraffiti={handleUnsealGraffiti}
          />
        ) : null}
      </Presence>
      <Presence present={isDetachingCharm(detachCharm)}>
        {isDetachingCharm(detachCharm) ? (
          <DetachCharm {...detachCharm} onClose={closeDetachCharm} />
        ) : null}
      </Presence>
      <Presence present={isUnpackingItem(unpackItem)}>
        {isUnpackingItem(unpackItem) ? (
          <UnpackItem
            {...unpackItem}
            onClose={closeUnpackItem}
            onUnpacked={handleInspectItem}
          />
        ) : null}
      </Presence>
      <Presence present={isUnsealingGraffiti(unsealGraffiti)}>
        {isUnsealingGraffiti(unsealGraffiti) ? (
          <UnsealGraffiti {...unsealGraffiti} onClose={closeUnsealGraffiti} />
        ) : null}
      </Presence>
    </>
  );
}
