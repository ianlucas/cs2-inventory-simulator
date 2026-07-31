/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  assert,
  CS2BaseInventoryItem,
  CS2Economy,
  CS2EconomyItem,
  CS2InventoryItem,
  CS2ItemType,
  RecordValue
} from "@ianlucas/cs2-lib";
import { z } from "zod";
import { api } from "~/api.server";
import { requireUser } from "~/auth.server";
import { ItemEditorAttributes } from "~/components/item-editor";
import { SyncAction } from "~/data/sync";
import { middleware } from "~/middleware.server";
import {
  craftAllowKeychains,
  craftAllowKeychainSeed,
  craftAllowKeychainX,
  craftAllowKeychainY,
  craftAllowKeychainZ,
  craftAllowNametag,
  craftAllowSeed,
  craftAllowStatTrak,
  craftAllowStickerRotation,
  craftAllowStickers,
  craftAllowStickerSchema,
  craftAllowStickerWear,
  craftAllowStickerX,
  craftAllowStickerY,
  craftAllowWear,
  craftHideCategory,
  craftHideId,
  craftHideModel,
  craftHideType,
  editAllowKeychains,
  editAllowKeychainSeed,
  editAllowKeychainX,
  editAllowKeychainY,
  editAllowKeychainZ,
  editAllowNametag,
  editAllowSeed,
  editAllowStatTrak,
  editAllowStickerRotation,
  editAllowStickers,
  editAllowStickerSchema,
  editAllowStickerWear,
  editAllowStickerX,
  editAllowStickerY,
  editAllowWear,
  editHideCategory,
  editHideId,
  editHideModel,
  editHideType,
  inventoryItemAllowApplyPatch,
  inventoryItemAllowApplySticker,
  inventoryItemAllowEdit,
  inventoryItemAllowRemovePatch,
  inventoryItemAllowRemoveSticker,
  inventoryItemAllowScrapeSticker,
  inventoryItemMaxPatches,
  inventoryItemMaxStickers
} from "~/models/rule.server";
import { manipulateUserInventory } from "~/models/user.server";
import { methodNotAllowed } from "~/responses.server";
import { isAttachmentCountAllowed } from "~/utils/attachments";
import { editInventoryItem } from "~/utils/inventory";
import { hasKeys } from "~/utils/misc";
import {
  nonNegativeInt,
  optionalStickerOffset,
  optionalStickerRotation,
  optionalStickerWear,
  teamShape
} from "~/utils/shapes";
import {
  clientInventoryItemShape,
  itemEditorAttributesShape,
  syncInventoryShape
} from "~/utils/shapes.server";
import type { Route } from "./+types/api.action.sync._index";

const stickerPlacementShape = {
  schema: nonNegativeInt,
  x: optionalStickerOffset,
  y: optionalStickerOffset,
  rotation: optionalStickerRotation,
  wear: optionalStickerWear
};

const actionShape = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(SyncAction.Add),
    item: clientInventoryItemShape
  }),
  z.object({
    type: z.literal(SyncAction.AddFromCache),
    data: syncInventoryShape
  }),
  z.object({
    type: z.literal(SyncAction.AddWithNametag),
    toolUid: nonNegativeInt,
    itemId: nonNegativeInt,
    nameTag: z.string()
  }),
  z.object({
    type: z.literal(SyncAction.ApplyItemPatch),
    patchUid: nonNegativeInt,
    slot: nonNegativeInt,
    targetUid: nonNegativeInt
  }),
  z.object({
    type: z.literal(SyncAction.ApplyItemSticker),
    stickerUid: nonNegativeInt,
    targetUid: nonNegativeInt,
    ...stickerPlacementShape
  }),
  z.object({
    type: z.literal(SyncAction.Equip),
    uid: nonNegativeInt,
    team: teamShape.optional()
  }),
  z.object({
    type: z.literal(SyncAction.Unequip),
    uid: nonNegativeInt,
    team: teamShape.optional()
  }),
  z.object({
    type: z.literal(SyncAction.RenameItem),
    toolUid: nonNegativeInt,
    targetUid: nonNegativeInt,
    nameTag: z.string().optional()
  }),
  z.object({
    type: z.literal(SyncAction.Remove),
    uid: nonNegativeInt
  }),
  z.object({
    type: z.literal(SyncAction.RemoveItemPatch),
    targetUid: nonNegativeInt,
    slot: nonNegativeInt
  }),
  z.object({
    type: z.literal(SyncAction.RemoveItemSticker),
    targetUid: nonNegativeInt,
    index: nonNegativeInt
  }),
  z.object({
    type: z.literal(SyncAction.ScrapeItemSticker),
    targetUid: nonNegativeInt,
    index: nonNegativeInt,
    wear: optionalStickerWear
  }),
  z.object({
    type: z.literal(SyncAction.SwapItemsStatTrak),
    fromUid: nonNegativeInt,
    toUid: nonNegativeInt,
    toolUid: nonNegativeInt
  }),
  z.object({
    type: z.literal(SyncAction.RenameStorageUnit),
    uid: nonNegativeInt,
    nameTag: z.string()
  }),
  z.object({
    depositUids: z.array(nonNegativeInt).max(1),
    type: z.literal(SyncAction.DepositToStorageUnit),
    uid: nonNegativeInt
  }),
  z.object({
    retrieveUids: z.array(nonNegativeInt).max(1),
    type: z.literal(SyncAction.RetrieveFromStorageUnit),
    uid: nonNegativeInt
  }),
  z.object({
    type: z.literal(SyncAction.Edit),
    uid: nonNegativeInt,
    attributes: itemEditorAttributesShape
  }),
  z.object({
    type: z.literal(SyncAction.AddWithSticker),
    itemId: nonNegativeInt,
    stickerUid: nonNegativeInt,
    ...stickerPlacementShape
  }),
  z.object({
    type: z.literal(SyncAction.RemoveAllItems)
  })
]);

export type ActionShape = z.infer<typeof actionShape>;

export type ApiActionSyncData = {
  syncedAt: number;
};

async function enforceMaxAttachments(
  {
    patches,
    stickers
  }: Pick<Partial<CS2BaseInventoryItem>, "patches" | "stickers">,
  userId: string,
  target?: CS2InventoryItem
) {
  assert(
    isAttachmentCountAllowed({
      current: target?.getPatchesCount() ?? 0,
      max: await inventoryItemMaxPatches.for(userId).get(),
      next: patches !== undefined ? Object.keys(patches).length : 0
    })
  );
  assert(
    isAttachmentCountAllowed({
      current: target?.getStickersCount() ?? 0,
      max: await inventoryItemMaxStickers.for(userId).get(),
      next: stickers !== undefined ? Object.keys(stickers).length : 0
    })
  );
}

async function enforceCraftRulesForItem(
  idOrItem: number | CS2EconomyItem,
  userId: string
) {
  const { categoryName, loadoutCategory, type, modelKey, id } =
    CS2Economy.get(idOrItem);
  const category = categoryName ?? loadoutCategory;
  await craftHideId.for(userId).notContains(id);
  if (category !== undefined) {
    await craftHideCategory.for(userId).notContains(category);
  }
  if (type !== undefined) {
    await craftHideType.for(userId).notContains(type);
  }
  if (modelKey !== undefined) {
    await craftHideModel.for(userId).notContains(modelKey);
  }
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

async function enforceCraftRulesForInventoryItem(
  item: Partial<CS2BaseInventoryItem>,
  userId: string
) {
  const { keychains, stickers, statTrak, wear, seed, nameTag } = item;
  await enforceMaxAttachments(item, userId);
  if (keychains !== undefined && hasKeys(keychains)) {
    await craftAllowKeychains.for(userId).truthy();
    await craftHideType.for(userId).notContains(CS2ItemType.Keychain);
    for (const keychain of Object.values(keychains)) {
      await enforceCraftRulesForItem(keychain.id, userId);
      await enforceCraftRulesForKeychainAttributes(keychain, userId);
    }
  }
  if (stickers !== undefined && hasKeys(stickers)) {
    await craftAllowStickers.for(userId).truthy();
    await craftHideType.for(userId).notContains(CS2ItemType.Sticker);
    for (const sticker of Object.values(stickers)) {
      await enforceCraftRulesForItem(sticker.id, userId);
      await enforceCraftRulesForStickerAttributes(sticker, userId);
    }
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
  if (nameTag !== undefined) {
    await craftAllowNametag.for(userId).truthy();
  }
}

async function enforceEditRulesForItem(
  idOrItem: number | CS2EconomyItem,
  userId: string
) {
  const { categoryName, loadoutCategory, type, modelKey, id } =
    CS2Economy.get(idOrItem);
  const category = categoryName ?? loadoutCategory;
  await editHideId.for(userId).notContains(id);
  if (category !== undefined) {
    await editHideCategory.for(userId).notContains(category);
  }
  if (type !== undefined) {
    await editHideType.for(userId).notContains(type);
  }
  if (modelKey !== undefined) {
    await editHideModel.for(userId).notContains(modelKey);
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

async function enforceEditRulesForInventoryItem(
  attributes: Partial<ItemEditorAttributes>,
  userId: string,
  target: CS2InventoryItem
) {
  const { keychains, stickers, statTrak, wear, seed, nameTag } = attributes;
  await enforceMaxAttachments(attributes, userId, target);
  if (keychains !== undefined && hasKeys(keychains)) {
    await editAllowKeychains.for(userId).truthy();
    await editHideType.for(userId).notContains(CS2ItemType.Keychain);
    for (const keychain of Object.values(keychains)) {
      await enforceEditRulesForItem(keychain.id, userId);
      await enforceEditRulesForKeychainAttributes(keychain, userId);
    }
  }
  if (stickers !== undefined && hasKeys(stickers)) {
    await editAllowStickers.for(userId).truthy();
    await editHideType.for(userId).notContains(CS2ItemType.Sticker);
    for (const sticker of Object.values(stickers)) {
      await enforceEditRulesForItem(sticker.id, userId);
      await enforceEditRulesForStickerAttributes(sticker, userId);
    }
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

export const action = api(async ({ request }: Route.ActionArgs) => {
  await middleware(request);
  if (request.method !== "POST") {
    throw methodNotAllowed;
  }
  const { id: userId, inventory: rawInventory } = await requireUser(request);
  const { syncedAt, actions } = z
    .object({
      syncedAt: z.number(),
      actions: z.array(actionShape)
    })
    .parse(await request.json());
  let addedFromCache = false;
  const { syncedAt: responseSyncedAt } = await manipulateUserInventory({
    rawInventory,
    syncedAt,
    userId,
    async manipulate(inventory) {
      for (const action of actions) {
        switch (action.type) {
          case SyncAction.Add:
            await enforceCraftRulesForItem(action.item.id, userId);
            await enforceCraftRulesForInventoryItem(action.item, userId);
            inventory.add(action.item);
            break;
          case SyncAction.AddFromCache:
            if (rawInventory === null && !addedFromCache) {
              for (const item of Object.values(action.data.items)) {
                try {
                  await enforceCraftRulesForItem(item.id, userId);
                  await enforceCraftRulesForInventoryItem(item, userId);
                  inventory.add(item);
                } catch {}
              }
              addedFromCache = true;
            }
            break;
          case SyncAction.AddWithNametag:
            await enforceCraftRulesForItem(action.itemId, userId);
            inventory.addWithNameTag(
              action.toolUid,
              action.itemId,
              action.nameTag
            );
            break;
          case SyncAction.ApplyItemPatch: {
            await inventoryItemAllowApplyPatch.for(userId).truthy();
            const count = inventory.get(action.targetUid).getPatchesCount();
            assert(
              isAttachmentCountAllowed({
                current: count,
                max: await inventoryItemMaxPatches.for(userId).get(),
                next: count + 1
              })
            );
            inventory.applyItemPatch(
              action.targetUid,
              action.patchUid,
              action.slot
            );
            break;
          }
          case SyncAction.ApplyItemSticker: {
            await inventoryItemAllowApplySticker.for(userId).truthy();
            const count = inventory.get(action.targetUid).getStickersCount();
            assert(
              isAttachmentCountAllowed({
                current: count,
                max: await inventoryItemMaxStickers.for(userId).get(),
                next: count + 1
              })
            );
            inventory.applyItemSticker(action.targetUid, action.stickerUid, {
              schema: action.schema,
              x: action.x,
              y: action.y,
              rotation: action.rotation,
              wear: action.wear
            });
            break;
          }
          case SyncAction.Equip:
            inventory.equip(action.uid, action.team);
            break;
          case SyncAction.Unequip:
            inventory.unequip(action.uid, action.team);
            break;
          case SyncAction.RenameItem:
            inventory.renameItem(
              action.toolUid,
              action.targetUid,
              action.nameTag
            );
            break;
          case SyncAction.Remove:
            inventory.remove(action.uid);
            break;
          case SyncAction.RemoveItemPatch:
            await inventoryItemAllowRemovePatch.for(userId).truthy();
            inventory.removeItemPatch(action.targetUid, action.slot);
            break;
          case SyncAction.RemoveItemSticker:
            await inventoryItemAllowRemoveSticker.for(userId).truthy();
            inventory.removeItemSticker(action.targetUid, action.index);
            break;
          case SyncAction.ScrapeItemSticker:
            await inventoryItemAllowScrapeSticker.for(userId).truthy();
            inventory.scrapeItemSticker(
              action.targetUid,
              action.index,
              action.wear
            );
            break;
          case SyncAction.SwapItemsStatTrak:
            inventory.swapItemsStatTrak(
              action.toolUid,
              action.fromUid,
              action.toUid
            );
            break;
          case SyncAction.RenameStorageUnit:
            inventory.renameStorageUnit(action.uid, action.nameTag);
            break;
          case SyncAction.DepositToStorageUnit:
            inventory.depositToStorageUnit(action.uid, action.depositUids);
            break;
          case SyncAction.RetrieveFromStorageUnit:
            inventory.retrieveFromStorageUnit(action.uid, action.retrieveUids);
            break;
          case SyncAction.Edit:
            await inventoryItemAllowEdit.for(userId).truthy();
            await enforceEditRulesForInventoryItem(
              action.attributes,
              userId,
              inventory.get(action.uid)
            );
            editInventoryItem(inventory, action.uid, action.attributes);
            break;
          case SyncAction.AddWithSticker:
            await enforceCraftRulesForItem(action.itemId, userId);
            assert(
              isAttachmentCountAllowed({
                current: 0,
                max: await inventoryItemMaxStickers.for(userId).get(),
                next: 1
              })
            );
            inventory.addWithSticker(action.stickerUid, action.itemId, {
              schema: action.schema,
              x: action.x,
              y: action.y,
              rotation: action.rotation,
              wear: action.wear
            });
            break;
          case SyncAction.RemoveAllItems:
            inventory.removeAll();
            break;
        }
      }
    }
  });

  return Response.json({
    syncedAt: responseSyncedAt.getTime()
  } satisfies ApiActionSyncData);
});

export { loader } from "./api.$";
