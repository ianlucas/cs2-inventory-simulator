/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { assert, CS2Team } from "@ianlucas/cs2-lib";
import { z } from "zod";
import { api } from "~/api.server";
import { requireUser } from "~/auth.server";
import { SyncAction } from "~/data/sync";
import { middleware } from "~/middleware.server";
import {
  enforceCraftRulesForInventoryItem,
  enforceEditRulesForInventoryItem
} from "~/models/item-attribute-rules.server";
import { enforceCraftItemHideRules } from "~/models/item-hide-rules.server";
import {
  inventoryItemAllowApplyPatch,
  inventoryItemAllowApplySticker,
  inventoryItemAllowEdit,
  inventoryItemAllowRemovePatch,
  inventoryItemAllowRemoveSticker,
  inventoryItemAllowScrapeSticker,
  inventoryItemMaxPatches,
  inventoryItemMaxStickers,
  inventoryMaxLoadouts
} from "~/models/rule.server";
import { manipulateUserInventory } from "~/models/user.server";
import { methodNotAllowed } from "~/responses.server";
import { editInventoryItem } from "~/shared/inventory";
import { LOADOUT_SLOTS } from "~/shared/loadout";
import { isCountAllowed } from "~/shared/number";
import {
  clientInventoryItemShape,
  itemEditorAttributesShape,
  nonNegativeInt,
  optionalNumber,
  syncInventoryShape,
  teamShape
} from "~/shared/shapes";
import { LOADOUT_NAME_MAX_LENGTH } from "~/shared/user-loadouts";
import type { Route } from "./+types/api.action.sync._index";

const keychainPlacementShape = {
  x: optionalNumber,
  y: optionalNumber,
  z: optionalNumber
};

const stickerPlacementShape = {
  schema: nonNegativeInt,
  x: optionalNumber,
  y: optionalNumber,
  rotation: optionalNumber,
  wear: optionalNumber
};

const loadoutShape = {
  id: z.uuid()
};

const loadoutNameShape = z.string().trim().min(1).max(LOADOUT_NAME_MAX_LENGTH);

const loadoutSlotShape = {
  ...loadoutShape,
  slot: z.enum(LOADOUT_SLOTS),
  team: z.literal(CS2Team.CT).or(z.literal(CS2Team.T))
};

const loadoutItemShape = z.discriminatedUnion("type", [
  z.object({ type: z.literal("inventory"), uid: nonNegativeInt }),
  z.object({
    type: z.literal("snapshot"),
    item: z.object({ id: nonNegativeInt })
  })
]);

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
    type: z.literal(SyncAction.ApplyItemKeychain),
    keychainUid: nonNegativeInt,
    targetUid: nonNegativeInt,
    ...keychainPlacementShape
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
    wear: optionalNumber
  }),
  z.object({
    type: z.literal(SyncAction.ExtractItemSticker),
    uid: nonNegativeInt
  }),
  z.object({
    type: z.literal(SyncAction.SealItemSticker),
    toolUid: nonNegativeInt,
    stickerUid: nonNegativeInt
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
    type: z.literal(SyncAction.RenamePet),
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
    type: z.literal(SyncAction.AddWithKeychain),
    itemId: nonNegativeInt,
    keychainUid: nonNegativeInt,
    ...keychainPlacementShape
  }),
  z.object({
    type: z.literal(SyncAction.AddWithSticker),
    itemId: nonNegativeInt,
    stickerUid: nonNegativeInt,
    ...stickerPlacementShape
  }),
  z.object({
    type: z.literal(SyncAction.RemoveAllItems)
  }),
  z.object({
    type: z.literal(SyncAction.UnpackItem),
    uid: nonNegativeInt
  }),
  z.object({
    type: z.literal(SyncAction.UnsealItem),
    uid: nonNegativeInt
  }),
  z.object({
    type: z.literal(SyncAction.RemoveItemKeychain),
    targetUid: nonNegativeInt,
    slot: nonNegativeInt
  }),
  z.object({
    type: z.literal(SyncAction.LoadoutCreate),
    ...loadoutShape,
    name: loadoutNameShape
  }),
  z.object({
    type: z.literal(SyncAction.LoadoutRename),
    ...loadoutShape,
    name: loadoutNameShape
  }),
  z.object({
    type: z.literal(SyncAction.LoadoutDelete),
    ...loadoutShape
  }),
  z.object({
    type: z.literal(SyncAction.LoadoutImportEquipped),
    ...loadoutShape
  }),
  z.object({
    type: z.literal(SyncAction.LoadoutUse),
    id: loadoutShape.id.nullable()
  }),
  z.object({
    type: z.literal(SyncAction.LoadoutPlace),
    ...loadoutSlotShape,
    item: loadoutItemShape
  }),
  z.object({
    type: z.literal(SyncAction.LoadoutResetSlot),
    ...loadoutSlotShape
  }),
  z.object({
    type: z.literal(SyncAction.LoadoutResetSlotFinish),
    ...loadoutSlotShape
  }),
  z.object({
    type: z.literal(SyncAction.LoadoutRemoveSlot),
    ...loadoutShape,
    slot: loadoutSlotShape.slot
  })
]);

export type ActionShape = z.infer<typeof actionShape>;

export type ApiActionSyncData = {
  syncedAt: number;
};

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
  let maxLoadouts: number | undefined;
  const { syncedAt: responseSyncedAt } = await manipulateUserInventory({
    syncedAt,
    userId,
    async manipulate(inventory, loadouts) {
      for (const action of actions) {
        switch (action.type) {
          case SyncAction.Add:
            await enforceCraftItemHideRules(action.item.id, userId);
            await enforceCraftRulesForInventoryItem(action.item, userId);
            inventory.add(action.item);
            break;
          case SyncAction.AddFromCache:
            if (rawInventory === null && !addedFromCache) {
              for (const item of Object.values(action.data.items)) {
                try {
                  await enforceCraftItemHideRules(item.id, userId);
                  await enforceCraftRulesForInventoryItem(item, userId);
                  inventory.add(item);
                } catch {}
              }
              addedFromCache = true;
            }
            break;
          case SyncAction.AddWithNametag:
            await enforceCraftItemHideRules(action.itemId, userId);
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
              isCountAllowed({
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
          case SyncAction.ApplyItemKeychain:
            inventory.applyItemKeychain(action.targetUid, action.keychainUid, {
              x: action.x,
              y: action.y,
              z: action.z
            });
            break;
          case SyncAction.ApplyItemSticker: {
            await inventoryItemAllowApplySticker.for(userId).truthy();
            const count = inventory.get(action.targetUid).getStickersCount();
            assert(
              isCountAllowed({
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
          case SyncAction.ExtractItemSticker:
            inventory.unsealStickerSlab(action.uid);
            break;
          case SyncAction.SealItemSticker:
            inventory.sealStickerSlab(action.toolUid, action.stickerUid);
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
          case SyncAction.RenamePet:
            inventory.renamePet(action.uid, action.nameTag);
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
          case SyncAction.AddWithKeychain:
            await enforceCraftItemHideRules(action.itemId, userId);
            inventory.addWithKeychain(action.keychainUid, action.itemId, {
              x: action.x,
              y: action.y,
              z: action.z
            });
            break;
          case SyncAction.AddWithSticker:
            await enforceCraftItemHideRules(action.itemId, userId);
            assert(
              isCountAllowed({
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
          case SyncAction.UnpackItem:
            inventory.unpackItem(action.uid);
            break;
          case SyncAction.UnsealItem:
            inventory.unsealItem(action.uid);
            break;
          case SyncAction.RemoveItemKeychain:
            inventory.removeItemKeychain(action.targetUid, action.slot);
            break;
          case SyncAction.LoadoutCreate:
          case SyncAction.LoadoutDelete:
          case SyncAction.LoadoutImportEquipped:
          case SyncAction.LoadoutPlace:
          case SyncAction.LoadoutRemoveSlot:
          case SyncAction.LoadoutRename:
          case SyncAction.LoadoutResetSlot:
          case SyncAction.LoadoutResetSlotFinish:
          case SyncAction.LoadoutUse:
            maxLoadouts ??= await inventoryMaxLoadouts.for(userId).get();
            await loadouts.apply(action, maxLoadouts);
            break;
        }
        await loadouts.detachRemovedItems();
      }
    }
  });

  return Response.json({
    syncedAt: responseSyncedAt.getTime()
  } satisfies ApiActionSyncData);
});

export { loader } from "./api.$";
