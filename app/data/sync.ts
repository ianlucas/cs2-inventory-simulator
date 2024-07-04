/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export const ApiActionSyncUrl = "/api/action/sync";

export const SyncAction = {
  Add: "add",
  AddFromCache: "add-from-cache",
  AddWithNametag: "add-with-nametag",
  AddWithSticker: "add-with-sticker",
  ApplyItemPatch: "apply-item-patch",
  ApplyItemSticker: "apply-item-sticker",
  DepositToStorageUnit: "deposit-to-storage-unit",
  Edit: "edit",
  Equip: "equip",
  Remove: "remove",
  RemoveAllItems: "remove-all-items",
  RemoveItemPatch: "remove-item-patch",
  RenameItem: "rename-item",
  RenameStorageUnit: "rename-storage-unit",
  RetrieveFromStorageUnit: "retrieve-from-storage-unit",
  ScrapeItemSticker: "scrape-item-sticker",
  SwapItemsStatTrak: "swap-items-stattrak",
  Unequip: "unequip"
} as const;
