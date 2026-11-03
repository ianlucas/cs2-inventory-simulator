/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  assert,
  CS2BaseInventoryItem,
  CS2InventoryItem,
  CS2ItemType,
  RecordValue
} from "@ianlucas/cs2-lib";
import { ItemEditorAttributes } from "~/components/item-editor";
import { hasKeys } from "~/shared/misc";
import { isCountAllowed } from "~/shared/number";
import {
  craftHideRules,
  editHideRules,
  enforceItemHideRules
} from "./item-hide-rules.server";
import {
  craftAllowKeychains,
  craftAllowKeychainSeed,
  craftAllowKeychainX,
  craftAllowKeychainY,
  craftAllowKeychainZ,
  craftAllowNametag,
  craftAllowSeed,
  craftAllowSouvenir,
  craftAllowStatTrak,
  craftAllowStickerRotation,
  craftAllowStickers,
  craftAllowStickerSchema,
  craftAllowStickerWear,
  craftAllowStickerX,
  craftAllowStickerY,
  craftAllowStyle,
  craftAllowUpgradeLevel,
  craftAllowWear,
  craftHideType,
  editAllowKeychains,
  editAllowKeychainSeed,
  editAllowKeychainX,
  editAllowKeychainY,
  editAllowKeychainZ,
  editAllowNametag,
  editAllowSeed,
  editAllowSouvenir,
  editAllowStatTrak,
  editAllowStickerRotation,
  editAllowStickers,
  editAllowStickerSchema,
  editAllowStickerWear,
  editAllowStickerX,
  editAllowStickerY,
  editAllowStyle,
  editAllowUpgradeLevel,
  editAllowWear,
  editHideType,
  inventoryItemMaxPatches,
  inventoryItemMaxStickers
} from "./rule.server";

async function enforceMaxAttachments(
  {
    patches,
    souvenir,
    stickers
  }: {
    patches?: CS2BaseInventoryItem["patches"];
    souvenir?: boolean;
    stickers?: CS2BaseInventoryItem["stickers"];
  },
  userId: string,
  target?: CS2InventoryItem
) {
  assert(
    isCountAllowed({
      current: target?.getPatchesCount() ?? 0,
      max: await inventoryItemMaxPatches.for(userId).get(),
      next: patches !== undefined ? Object.keys(patches).length : 0
    })
  );
  if (souvenir === true) {
    return;
  }
  assert(
    isCountAllowed({
      current: target?.getStickersCount() ?? 0,
      max: await inventoryItemMaxStickers.for(userId).get(),
      next: stickers !== undefined ? Object.keys(stickers).length : 0
    })
  );
}

async function enforceCraftRulesForStickerAttributes(
  {
    wear,
    rotation,
    x,
    y,
    schema
  }: RecordValue<NonNullable<CS2BaseInventoryItem["stickers"]>>,
  userId: string
) {
  if (wear !== undefined) {
    await craftAllowStickerWear.for(userId).truthy();
  }
  if (rotation !== undefined) {
    await craftAllowStickerRotation.for(userId).truthy();
  }
  if (x !== undefined) {
    await craftAllowStickerX.for(userId).truthy();
  }
  if (y !== undefined) {
    await craftAllowStickerY.for(userId).truthy();
  }
  if (schema !== undefined) {
    await craftAllowStickerSchema.for(userId).truthy();
  }
}

async function enforceCraftRulesForKeychainAttributes(
  {
    seed,
    x,
    y,
    z
  }: RecordValue<NonNullable<CS2BaseInventoryItem["keychains"]>>,
  userId: string
) {
  if (seed !== undefined) {
    await craftAllowKeychainSeed.for(userId).truthy();
  }
  if (x !== undefined) {
    await craftAllowKeychainX.for(userId).truthy();
  }
  if (y !== undefined) {
    await craftAllowKeychainY.for(userId).truthy();
  }
  if (z !== undefined) {
    await craftAllowKeychainZ.for(userId).truthy();
  }
}

export async function enforceCraftRulesForInventoryItem(
  item: Partial<CS2BaseInventoryItem>,
  userId: string
) {
  const {
    keychains,
    souvenir,
    stickers,
    statTrak,
    wear,
    seed,
    style,
    upgradeLevel,
    nameTag
  } = item;
  await enforceMaxAttachments(item, userId);
  if (keychains !== undefined && hasKeys(keychains)) {
    await craftAllowKeychains.for(userId).truthy();
    await craftHideType.for(userId).notContains(CS2ItemType.Keychain);
    for (const keychain of Object.values(keychains)) {
      await enforceItemHideRules(keychain.id, userId, craftHideRules);
      await enforceCraftRulesForKeychainAttributes(keychain, userId);
    }
  }
  if (stickers !== undefined && hasKeys(stickers)) {
    if (souvenir !== true) {
      await craftAllowStickers.for(userId).truthy();
      await craftHideType.for(userId).notContains(CS2ItemType.Sticker);
    }
    for (const sticker of Object.values(stickers)) {
      await enforceItemHideRules(sticker.id, userId, craftHideRules);
      await enforceCraftRulesForStickerAttributes(sticker, userId);
    }
  }
  if (souvenir === true) {
    await craftAllowSouvenir.for(userId).truthy();
  }
  if (statTrak !== undefined) {
    await craftAllowStatTrak.for(userId).truthy();
  }
  if (wear !== undefined) {
    await craftAllowWear.for(userId).truthy();
  }
  if (seed !== undefined) {
    await craftAllowSeed.for(userId).truthy();
  }
  if (style !== undefined) {
    await craftAllowStyle.for(userId).truthy();
  }
  if (upgradeLevel !== undefined) {
    await craftAllowUpgradeLevel.for(userId).truthy();
  }
  if (nameTag !== undefined) {
    await craftAllowNametag.for(userId).truthy();
  }
}

async function enforceEditRulesForKeychainAttributes(
  {
    seed,
    x,
    y,
    z
  }: RecordValue<NonNullable<CS2BaseInventoryItem["keychains"]>>,
  userId: string
) {
  if (seed !== undefined) {
    await editAllowKeychainSeed.for(userId).truthy();
  }
  if (x !== undefined) {
    await editAllowKeychainX.for(userId).truthy();
  }
  if (y !== undefined) {
    await editAllowKeychainY.for(userId).truthy();
  }
  if (z !== undefined) {
    await editAllowKeychainZ.for(userId).truthy();
  }
}

export async function enforceEditRulesForInventoryItem(
  attributes: Partial<ItemEditorAttributes>,
  userId: string,
  target: CS2InventoryItem
) {
  const {
    keychains,
    souvenir,
    stickers,
    statTrak,
    wear,
    seed,
    style,
    upgradeLevel,
    nameTag
  } = attributes;
  await enforceMaxAttachments(attributes, userId, target);
  if (keychains !== undefined && hasKeys(keychains)) {
    await editAllowKeychains.for(userId).truthy();
    await editHideType.for(userId).notContains(CS2ItemType.Keychain);
    for (const keychain of Object.values(keychains)) {
      await enforceItemHideRules(keychain.id, userId, editHideRules);
      await enforceEditRulesForKeychainAttributes(keychain, userId);
    }
  }
  if (stickers !== undefined && hasKeys(stickers)) {
    if (souvenir !== true) {
      await editAllowStickers.for(userId).truthy();
      await editHideType.for(userId).notContains(CS2ItemType.Sticker);
    }
    for (const sticker of Object.values(stickers)) {
      await enforceItemHideRules(sticker.id, userId, editHideRules);
      await enforceEditRulesForStickerAttributes(sticker, userId);
    }
  }
  if (souvenir === true) {
    await editAllowSouvenir.for(userId).truthy();
  }
  if (statTrak !== undefined) {
    await editAllowStatTrak.for(userId).truthy();
  }
  if (wear !== undefined) {
    await editAllowWear.for(userId).truthy();
  }
  if (seed !== undefined) {
    await editAllowSeed.for(userId).truthy();
  }
  if (style !== undefined) {
    await editAllowStyle.for(userId).truthy();
  }
  if (upgradeLevel !== undefined) {
    await editAllowUpgradeLevel.for(userId).truthy();
  }
  if (nameTag !== undefined) {
    await editAllowNametag.for(userId).truthy();
  }
}

async function enforceEditRulesForStickerAttributes(
  {
    wear,
    rotation,
    x,
    y,
    schema
  }: RecordValue<NonNullable<CS2BaseInventoryItem["stickers"]>>,
  userId: string
) {
  if (wear !== undefined) {
    await editAllowStickerWear.for(userId).truthy();
  }
  if (rotation !== undefined) {
    await editAllowStickerRotation.for(userId).truthy();
  }
  if (x !== undefined) {
    await editAllowStickerX.for(userId).truthy();
  }
  if (y !== undefined) {
    await editAllowStickerY.for(userId).truthy();
  }
  if (schema !== undefined) {
    await editAllowStickerSchema.for(userId).truthy();
  }
}
