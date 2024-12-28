/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2BaseInventoryItem,
  CS2Economy,
  CS2EconomyItem,
  CS2ItemType
} from "@ianlucas/cs2-lib";
import { z } from "zod";
import { api } from "~/api.server";
import { requireUser } from "~/auth.server";
import { SyncAction } from "~/data/sync";
import { middleware } from "~/http.server";
import {
  craftAllowNametag,
  craftAllowSeed,
  craftAllowStatTrak,
  craftAllowStickers,
  craftAllowWear,
  craftHideCategory,
  craftHideId,
  craftHideModel,
  craftHideType,
  editAllowNametag,
  editAllowSeed,
  editAllowStatTrak,
  editAllowStickers,
  editAllowWear,
  editHideCategory,
  editHideId,
  editHideModel,
  editHideType,
  inventoryItemAllowApplyPatch,
  inventoryItemAllowApplySticker,
  inventoryItemAllowEdit,
  inventoryItemAllowRemovePatch,
  inventoryItemAllowScrapeSticker
} from "~/models/rule.server";
import { manipulateUserInventory } from "~/models/user.server";
import { methodNotAllowed } from "~/responses.server";
import { nonNegativeInt, teamShape } from "~/utils/shapes";
import {
  clientInventoryItemShape,
  syncInventoryShape
} from "~/utils/shapes.server";
import type { Route } from "./+types/api.action.sync._index";

const actionShape = z
  .object({
    type: z.literal(SyncAction.Add),
    item: clientInventoryItemShape
  })
  .or(
    z.object({
      type: z.literal(SyncAction.AddFromCache),
      data: syncInventoryShape
    })
  )
  .or(
    z.object({
      type: z.literal(SyncAction.AddWithNametag),
      toolUid: nonNegativeInt,
      itemId: nonNegativeInt,
      nameTag: z.string()
    })
  )
  .or(
    z.object({
      type: z.literal(SyncAction.ApplyItemPatch),
      patchUid: nonNegativeInt,
      slot: nonNegativeInt,
      targetUid: nonNegativeInt
    })
  )
  .or(
    z.object({
      type: z.literal(SyncAction.ApplyItemSticker),
      slot: nonNegativeInt,
      stickerUid: nonNegativeInt,
      targetUid: nonNegativeInt
    })
  )
  .or(
    z.object({
      type: z.literal(SyncAction.Equip),
      uid: nonNegativeInt,
      team: teamShape.optional()
    })
  )
  .or(
    z.object({
      type: z.literal(SyncAction.Unequip),
      uid: nonNegativeInt,
      team: teamShape.optional()
    })
  )
  .or(
    z.object({
      type: z.literal(SyncAction.RenameItem),
      toolUid: nonNegativeInt,
      targetUid: nonNegativeInt,
      nameTag: z.string().optional()
    })
  )
  .or(
    z.object({
      type: z.literal(SyncAction.Remove),
      uid: nonNegativeInt
    })
  )
  .or(
    z.object({
      type: z.literal(SyncAction.RemoveItemPatch),
      targetUid: nonNegativeInt,
      slot: nonNegativeInt
    })
  )
  .or(
    z.object({
      type: z.literal(SyncAction.ScrapeItemSticker),
      targetUid: nonNegativeInt,
      slot: nonNegativeInt
    })
  )
  .or(
    z.object({
      type: z.literal(SyncAction.SwapItemsStatTrak),
      fromUid: nonNegativeInt,
      toUid: nonNegativeInt,
      toolUid: nonNegativeInt
    })
  )
  .or(
    z.object({
      type: z.literal(SyncAction.RenameStorageUnit),
      uid: nonNegativeInt,
      nameTag: z.string()
    })
  )
  .or(
    z.object({
      depositUids: z.array(nonNegativeInt).max(1),
      type: z.literal(SyncAction.DepositToStorageUnit),
      uid: nonNegativeInt
    })
  )
  .or(
    z.object({
      retrieveUids: z.array(nonNegativeInt).max(1),
      type: z.literal(SyncAction.RetrieveFromStorageUnit),
      uid: nonNegativeInt
    })
  )
  .or(
    z.object({
      type: z.literal(SyncAction.Edit),
      uid: nonNegativeInt,
      attributes: clientInventoryItemShape
    })
  )
  .or(
    z.object({
      type: z.literal(SyncAction.AddWithSticker),
      itemId: nonNegativeInt,
      slot: nonNegativeInt,
      stickerUid: nonNegativeInt
    })
  )
  .or(
    z.object({
      type: z.literal(SyncAction.RemoveAllItems)
    })
  );

export type ActionShape = z.infer<typeof actionShape>;

export type ApiActionSyncData = {
  syncedAt: number;
};

async function enforceCraftRulesForItem(
  idOrItem: number | CS2EconomyItem,
  userId: string
) {
  const { category, type, model, id } = CS2Economy.get(idOrItem);
  await craftHideId.for(userId).notContains(id);
  if (category !== undefined) {
    await craftHideCategory.for(userId).notContains(category);
  }
  if (type !== undefined) {
    await craftHideType.for(userId).notContains(type);
  }
  if (model !== undefined) {
    await craftHideModel.for(userId).notContains(model);
  }
}

async function enforceCraftRulesForInventoryItem(
  { stickers, statTrak, wear, seed, nameTag }: Partial<CS2BaseInventoryItem>,
  userId: string
) {
  if (stickers !== undefined) {
    await craftAllowStickers.for(userId).truthy();
    await craftHideType.for(userId).notContains(CS2ItemType.Sticker);
    for (const sticker of Object.values(stickers)) {
      await enforceCraftRulesForItem(sticker.id, userId);
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
  const { category, type, model, id } = CS2Economy.get(idOrItem);
  await editHideId.for(userId).notContains(id);
  if (category !== undefined) {
    await editHideCategory.for(userId).notContains(category);
  }
  if (type !== undefined) {
    await editHideType.for(userId).notContains(type);
  }
  if (model !== undefined) {
    await editHideModel.for(userId).notContains(model);
  }
}

async function enforceEditRulesForInventoryItem(
  { stickers, statTrak, wear, seed, nameTag }: Partial<CS2BaseInventoryItem>,
  userId: string
) {
  if (stickers !== undefined) {
    await editAllowStickers.for(userId).truthy();
    await editHideType.for(userId).notContains(CS2ItemType.Sticker);
    for (const sticker of Object.values(stickers)) {
      await enforceEditRulesForItem(sticker.id, userId);
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
            await enforceCraftRulesForInventoryItem(action.item, userId);
            await enforceCraftRulesForItem(action.item.id, userId);
            inventory.add(action.item);
            break;
          case SyncAction.AddFromCache:
            if (rawInventory === null && !addedFromCache) {
              for (const item of Object.values(action.data.items)) {
                try {
                  await enforceCraftRulesForInventoryItem(item, userId);
                  await enforceCraftRulesForItem(item.id, userId);
                  inventory.add(item);
                } catch {}
              }
              addedFromCache = true;
            }
            break;
          case SyncAction.AddWithNametag:
            await enforceCraftRulesForItem(action.itemId, userId);
            inventory.addWithNametag(
              action.toolUid,
              action.itemId,
              action.nameTag
            );
            break;
          case SyncAction.ApplyItemPatch:
            await inventoryItemAllowApplyPatch.for(userId).truthy();
            inventory.applyItemPatch(
              action.targetUid,
              action.patchUid,
              action.slot
            );
            break;
          case SyncAction.ApplyItemSticker:
            await inventoryItemAllowApplySticker.for(userId).truthy();
            inventory.applyItemSticker(
              action.targetUid,
              action.stickerUid,
              action.slot
            );
            break;
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
          case SyncAction.ScrapeItemSticker:
            await inventoryItemAllowScrapeSticker.for(userId).truthy();
            inventory.scrapeItemSticker(action.targetUid, action.slot);
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
            await enforceEditRulesForItem(action.attributes.id, userId);
            await enforceEditRulesForInventoryItem(action.attributes, userId);
            inventory.edit(action.uid, {
              ...action.attributes,
              statTrak:
                action.attributes.statTrak !== undefined
                  ? (inventory.get(action.uid).statTrak ?? 0)
                  : undefined,
              nameTag: action.attributes.nameTag
            });
            break;
          case SyncAction.AddWithSticker:
            await enforceCraftRulesForItem(action.itemId, userId);
            inventory.addWithSticker(
              action.stickerUid,
              action.itemId,
              action.slot
            );
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
