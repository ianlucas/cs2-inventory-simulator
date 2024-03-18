/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_createInventory } from "@ianlucas/cslib";
import { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { requireUser } from "~/auth.server";
import {
  MAX_INVENTORY_ITEMS,
  MAX_INVENTORY_STORAGE_UNIT_ITEMS
} from "~/env.server";
import { middleware } from "~/http.server";
import { manipulateUserInventory } from "~/models/user.server";
import { noContent } from "~/response.server";
import { teamShape, nonNegativeInt } from "~/utils/shapes";
import {
  clientInventoryItemShape,
  syncInventoryShape
} from "~/utils/shapes.server";

export const ApiActionSync = "/api/action/sync";
export const AddAction = "add";
export const AddFromCacheAction = "add-from-cache";
export const AddWithNametagAction = "add-with-nametag";
export const AddWithStickerAction = "add-with-sticker";
export const ApplyItemStickerAction = "apply-item-sticker";
export const DepositToStorageUnitAction = "deposit-to-storage-unit";
export const EditAction = "edit";
export const EquipAction = "equip";
export const RemoveAction = "remove";
export const RemoveAllItemsAction = "remove-all-items";
export const RenameItemAction = "rename-item";
export const RenameStorageUnitAction = "rename-storage-unit";
export const RetrieveFromStorageUnitAction = "retrieve-from-storage-unit";
export const ScrapeItemStickerAction = "scrape-item-sticker";
export const SwapItemsStatTrakAction = "swap-items-stattrak";
export const UnequipAction = "unequip";

const actionShape = z
  .object({
    type: z.literal(AddAction),
    item: clientInventoryItemShape
  })
  .or(
    z.object({
      type: z.literal(AddFromCacheAction),
      items: syncInventoryShape
    })
  )
  .or(
    z.object({
      type: z.literal(AddWithNametagAction),
      toolUid: nonNegativeInt,
      itemId: nonNegativeInt,
      nametag: z.string()
    })
  )
  .or(
    z.object({
      type: z.literal(ApplyItemStickerAction),
      targetUid: nonNegativeInt,
      stickerUid: nonNegativeInt,
      stickerIndex: nonNegativeInt
    })
  )
  .or(
    z.object({
      type: z.literal(EquipAction),
      uid: nonNegativeInt,
      team: teamShape.optional()
    })
  )
  .or(
    z.object({
      type: z.literal(UnequipAction),
      uid: nonNegativeInt,
      team: teamShape.optional()
    })
  )
  .or(
    z.object({
      type: z.literal(RenameItemAction),
      toolUid: nonNegativeInt,
      targetUid: nonNegativeInt,
      nametag: z.string().optional()
    })
  )
  .or(
    z.object({
      type: z.literal(RemoveAction),
      uid: nonNegativeInt
    })
  )
  .or(
    z.object({
      type: z.literal(ScrapeItemStickerAction),
      targetUid: nonNegativeInt,
      stickerIndex: nonNegativeInt
    })
  )
  .or(
    z.object({
      type: z.literal(SwapItemsStatTrakAction),
      fromUid: nonNegativeInt,
      toUid: nonNegativeInt,
      toolUid: nonNegativeInt
    })
  )
  .or(
    z.object({
      type: z.literal(RenameStorageUnitAction),
      uid: nonNegativeInt,
      nametag: z.string()
    })
  )
  .or(
    z.object({
      depositUids: z
        .array(nonNegativeInt)
        .max(MAX_INVENTORY_STORAGE_UNIT_ITEMS),
      type: z.literal(DepositToStorageUnitAction),
      uid: nonNegativeInt
    })
  )
  .or(
    z.object({
      retrieveUids: z
        .array(nonNegativeInt)
        .max(MAX_INVENTORY_STORAGE_UNIT_ITEMS),
      type: z.literal(RetrieveFromStorageUnitAction),
      uid: nonNegativeInt
    })
  )
  .or(
    z.object({
      type: z.literal(EditAction),
      uid: nonNegativeInt,
      attributes: clientInventoryItemShape
    })
  )
  .or(
    z.object({
      type: z.literal(AddWithStickerAction),
      stickerUid: nonNegativeInt,
      itemId: nonNegativeInt,
      stickerIndex: nonNegativeInt
    })
  )
  .or(
    z.object({
      type: z.literal(RemoveAllItemsAction)
    })
  );

export type ActionShape = z.infer<typeof actionShape>;

export async function action({ request }: ActionFunctionArgs) {
  await middleware(request);
  const { id: userId, inventory: rawInventory } = await requireUser(request);
  const actions = z.array(actionShape).parse(await request.json());
  let addedFromCache = false;
  await manipulateUserInventory(userId, rawInventory, (inventory) =>
    actions.forEach((action) => {
      switch (action.type) {
        case AddAction:
          return inventory.add(action.item);
        case AddFromCacheAction:
          if (rawInventory === null && !addedFromCache) {
            CS_createInventory({
              items: action.items,
              limit: MAX_INVENTORY_ITEMS,
              storageUnitLimit: MAX_INVENTORY_STORAGE_UNIT_ITEMS
            })
              .getAll()
              .forEach((item) => inventory.add(item));
            addedFromCache = true;
          }
          return;
        case AddWithNametagAction:
          return inventory.addWithNametag(
            action.toolUid,
            action.itemId,
            action.nametag
          );
        case ApplyItemStickerAction:
          return inventory.applyItemSticker(
            action.targetUid,
            action.stickerUid,
            action.stickerIndex
          );
        case EquipAction:
          return inventory.equip(action.uid, action.team);
        case UnequipAction:
          return inventory.unequip(action.uid, action.team);
        case RenameItemAction:
          return inventory.renameItem(
            action.toolUid,
            action.targetUid,
            action.nametag
          );
        case RemoveAction:
          return inventory.remove(action.uid);
        case ScrapeItemStickerAction:
          return inventory.scrapeItemSticker(
            action.targetUid,
            action.stickerIndex
          );
        case SwapItemsStatTrakAction:
          return inventory.swapItemsStatTrak(
            action.toolUid,
            action.fromUid,
            action.toUid
          );
        case RenameStorageUnitAction:
          return inventory.renameStorageUnit(action.uid, action.nametag);
        case DepositToStorageUnitAction:
          return inventory.depositToStorageUnit(action.uid, action.depositUids);
        case RetrieveFromStorageUnitAction:
          return inventory.retrieveFromStorageUnit(
            action.uid,
            action.retrieveUids
          );
        case EditAction:
          return inventory.edit(action.uid, {
            ...action.attributes,
            stattrak:
              action.attributes.stattrak !== undefined
                ? inventory.get(action.uid).stattrak ?? 0
                : undefined,
            nametag: action.attributes.nametag
          });
        case AddWithStickerAction:
          return inventory.addWithSticker(
            action.stickerUid,
            action.itemId,
            action.stickerIndex
          );
        case RemoveAllItemsAction:
          return inventory.removeAll();
      }
    })
  );
  return noContent;
}
