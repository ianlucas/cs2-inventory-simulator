/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  appCacheInventory,
  appFaviconMimeType,
  appFaviconUrl,
  appFooterName,
  appLogoUrl,
  appName,
  appSeoDescription,
  appSeoImageUrl,
  appSeoTitle,
  craftAllowKeychain,
  craftAllowNametag,
  craftAllowPatches,
  craftAllowSeed,
  craftAllowStatTrak,
  craftAllowStickers,
  craftAllowWear,
  craftHideCategory,
  craftHideFilterType,
  craftHideId,
  craftHideModel,
  craftHideType,
  craftMaxQuantity,
  editAllowKeychain,
  editAllowNametag,
  editAllowPatches,
  editAllowSeed,
  editAllowStatTrak,
  editAllowStickers,
  editAllowWear,
  editHideCategory,
  editHideId,
  editHideModel,
  editHideType,
  inventoryItemAllowApplyKeychain,
  inventoryItemAllowApplyPatch,
  inventoryItemAllowApplySticker,
  inventoryItemAllowEdit,
  inventoryItemAllowInspectInGame,
  inventoryItemAllowRemoveKeychain,
  inventoryItemAllowRemovePatch,
  inventoryItemAllowScrapeSticker,
  inventoryItemAllowShare,
  inventoryItemAllowUnlockContainer,
  inventoryItemEquipHideModel,
  inventoryItemEquipHideType,
  inventoryMaxItems,
  inventoryStorageUnitMaxItems,
  Rule
} from "./rule.server";

export async function setupRules() {
  return await Promise.all(
    Rule.instances.map(async (rule) => await rule.register())
  );
}

export async function getRules<T extends Record<string, Rule<any, any>>>(
  rules: T,
  userId?: string
): Promise<{
  [K in keyof T]: T[K]["defaultValue"];
}> {
  return Object.fromEntries(
    await Promise.all(
      Object.entries(rules).map(async ([name, rule]) => [
        name,
        userId !== undefined ? await rule.for(userId).get() : await rule.get()
      ])
    )
  );
}

export async function getClientRules(userId?: string) {
  return await getRules(
    {
      appCacheInventory,
      appFaviconMimeType,
      appFaviconUrl,
      appFooterName,
      appLogoUrl,
      appName,
      appSeoDescription,
      appSeoImageUrl,
      appSeoTitle,
      craftAllowKeychain,
      craftAllowNametag,
      craftAllowPatches,
      craftAllowSeed,
      craftAllowStatTrak,
      craftAllowStickers,
      craftAllowWear,
      craftHideCategory,
      craftHideFilterType,
      craftHideId,
      craftHideModel,
      craftHideType,
      craftMaxQuantity,
      editAllowKeychain,
      editAllowNametag,
      editAllowPatches,
      editAllowSeed,
      editAllowStatTrak,
      editAllowStickers,
      editAllowWear,
      editHideCategory,
      editHideId,
      editHideModel,
      editHideType,
      inventoryItemAllowApplyKeychain,
      inventoryItemAllowApplyPatch,
      inventoryItemAllowApplySticker,
      inventoryItemAllowEdit,
      inventoryItemAllowInspectInGame,
      inventoryItemAllowRemoveKeychain,
      inventoryItemAllowRemovePatch,
      inventoryItemAllowScrapeSticker,
      inventoryItemAllowShare,
      inventoryItemAllowUnlockContainer,
      inventoryItemEquipHideModel,
      inventoryItemEquipHideType,
      inventoryMaxItems,
      inventoryStorageUnitMaxItems
    },
    userId
  );
}
