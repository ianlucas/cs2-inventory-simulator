/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export const ApiActionSyncUrl = "/api/action/sync";

export const SyncAction = {
  Add: "add",
  AddFromCache: "add-from-cache",
  AddWithKeychain: "add-with-keychain",
  AddWithNametag: "add-with-nametag",
  AddWithSticker: "add-with-sticker",
  ApplyItemKeychain: "apply-item-keychain",
  ApplyItemPatch: "apply-item-patch",
  ApplyItemSticker: "apply-item-sticker",
  DepositToStorageUnit: "deposit-to-storage-unit",
  Edit: "edit",
  Equip: "equip",
  ExtractItemSticker: "extract-item-sticker",
  Remove: "remove",
  RemoveAllItems: "remove-all-items",
  RemoveItemKeychain: "remove-item-keychain",
  RemoveItemPatch: "remove-item-patch",
  RemoveItemSticker: "remove-item-sticker",
  RenameItem: "rename-item",
  RenameStorageUnit: "rename-storage-unit",
  RetrieveFromStorageUnit: "retrieve-from-storage-unit",
  ScrapeItemSticker: "scrape-item-sticker",
  SealItemSticker: "seal-item-sticker",
  SwapItemsStatTrak: "swap-items-stattrak",
  Unequip: "unequip",
  UnpackItem: "unpack-item"
} as const;
