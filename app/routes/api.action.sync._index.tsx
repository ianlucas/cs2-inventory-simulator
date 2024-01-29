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
export const EquipAction = "equip";
export const RemoveAction = "remove";
export const RenameItemAction = "rename-item";
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
      toolIndex: z.number(),
      itemId: z.number(),
      nametag: z.string()
    })
  )
  .or(
    z.object({
      type: z.literal(ApplyItemStickerAction),
      itemIndex: z.number(),
      stickerItemIndex: z.number(),
      stickerIndex: z.number()
    })
  )
  .or(
    z.object({
      type: z.literal(EquipAction),
      index: z.number(),
      team: teamShape.optional()
    })
  )
  .or(
    z.object({
      type: z.literal(UnequipAction),
      index: z.number(),
      team: teamShape.optional()
    })
  )
  .or(
    z.object({
      type: z.literal(RenameItemAction),
      toolIndex: z.number(),
      targetIndex: z.number(),
      nametag: z.string().optional()
    })
  )
  .or(
    z.object({
      type: z.literal(RemoveAction),
      index: z.number()
    })
  )
  .or(
    z.object({
      type: z.literal(ScrapeItemStickerAction),
      itemIndex: z.number(),
      stickerIndex: z.number()
    })
  )
  .or(
    z.object({
      type: z.literal(SwapItemsStatTrakAction),
      fromIndex: z.number(),
      toIndex: z.number(),
      toolIndex: z.number()
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
            action.toolIndex,
            action.itemId,
            action.nametag
          );
        case ApplyItemStickerAction:
          return inventory.applyItemSticker(
            action.itemIndex,
            action.stickerItemIndex,
            action.stickerIndex
          );
        case EquipAction:
          return inventory.equip(action.index, action.team);
        case UnequipAction:
          return inventory.unequip(action.index, action.team);
        case RenameItemAction:
          return inventory.renameItem(
            action.toolIndex,
            action.targetIndex,
            action.nametag
          );
        case RemoveAction:
          return inventory.remove(action.index);
        case ScrapeItemStickerAction:
          return inventory.scrapeItemSticker(
            action.itemIndex,
            action.stickerIndex
          );
        case SwapItemsStatTrakAction:
          return inventory.swapItemsStatTrak(
            action.toolIndex,
            action.fromIndex,
            action.toIndex
          );
      }
    })
  );
  return noContent;
}
