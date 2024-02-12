/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { requireUser } from "~/auth.server";
import { middleware } from "~/http.server";
import { manipulateUserInventory } from "~/models/user.server";
import { noContent } from "~/response.server";
import {
  externalInventoryItemShape,
  externalInventoryShape,
  teamShape
} from "~/utils/shapes";

export const ApiActionSync = "/api/action/sync";
export const AddAction = "add";
export const AddFromCacheAction = "add-from-cache";
export const AddWithNametagAction = "add-with-nametag";
export const ApplyItemStickerAction = "apply-item-sticker";
export const DepositToStorageUnitAction = "deposit-to-storage-unit";
export const EquipAction = "equip";
export const RemoveAction = "remove";
export const RenameItemAction = "rename-item";
export const RenameStorageUnitAction = "rename-storage-unit";
export const RetrieveFromStorageUnitAction = "retrieve-from-storage-unit";
export const ScrapeItemStickerAction = "scrape-item-sticker";
export const SwapItemsStatTrakAction = "swap-items-stattrak";
export const UnequipAction = "unequip";

export const actionShape = z
  .object({
    type: z.literal(AddAction),
    item: externalInventoryItemShape
  })
  .or(
    z.object({
      type: z.literal(AddFromCacheAction),
      items: externalInventoryShape
    })
  )
  .or(
    z.object({
      type: z.literal(AddWithNametagAction),
      toolUid: z.number(),
      itemId: z.number(),
      nametag: z.string()
    })
  )
  .or(
    z.object({
      type: z.literal(ApplyItemStickerAction),
      targetUid: z.number(),
      stickerUid: z.number(),
      stickerIndex: z.number()
    })
  )
  .or(
    z.object({
      type: z.literal(EquipAction),
      uid: z.number(),
      team: teamShape.optional()
    })
  )
  .or(
    z.object({
      type: z.literal(UnequipAction),
      uid: z.number(),
      team: teamShape.optional()
    })
  )
  .or(
    z.object({
      type: z.literal(RenameItemAction),
      toolUid: z.number(),
      targetUid: z.number(),
      nametag: z.string().optional()
    })
  )
  .or(
    z.object({
      type: z.literal(RemoveAction),
      uid: z.number()
    })
  )
  .or(
    z.object({
      type: z.literal(ScrapeItemStickerAction),
      targetUid: z.number(),
      stickerIndex: z.number()
    })
  )
  .or(
    z.object({
      type: z.literal(SwapItemsStatTrakAction),
      fromUid: z.number(),
      toUid: z.number(),
      toolUid: z.number()
    })
  )
  .or(
    z.object({
      type: z.literal(RenameStorageUnitAction),
      uid: z.number(),
      nametag: z.string()
    })
  )
  .or(
    z.object({
      type: z.literal(DepositToStorageUnitAction),
      uid: z.number(),
      depositUids: z.array(z.number())
    })
  )
  .or(
    z.object({
      type: z.literal(RetrieveFromStorageUnitAction),
      uid: z.number(),
      retrieveUids: z.array(z.number())
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
            action.items.forEach((item) => inventory.add(item));
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
      }
    })
  );
  return noContent;
}
