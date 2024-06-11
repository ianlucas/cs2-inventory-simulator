/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2BaseInventoryItem,
  CS2Economy,
  CS2EconomyItem,
  CS2Inventory,
  CS2ItemType,
  CS2_INVENTORY_VERSION
} from "@ianlucas/cs2-lib";
import { ActionFunctionArgs, json } from "@remix-run/node";
import { z } from "zod";
import { requireUser } from "~/auth.server";
import { middleware } from "~/http.server";
import { getRequestHostname } from "~/models/domain.server";
import {
  expectRule,
  expectRuleNotContain,
  getRule
} from "~/models/rule.server";
import { manipulateUserInventory } from "~/models/user.server";
import { nonNegativeInt, teamShape } from "~/utils/shapes";
import {
  clientInventoryItemShape,
  syncInventoryShape
} from "~/utils/shapes.server";

export const ApiActionSyncUrl = "/api/action/sync";
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
      nameTag: z.string()
    })
  )
  .or(
    z.object({
      type: z.literal(ApplyItemStickerAction),
      slot: nonNegativeInt,
      stickerUid: nonNegativeInt,
      targetUid: nonNegativeInt
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
      nameTag: z.string().optional()
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
      slot: nonNegativeInt
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
      nameTag: z.string()
    })
  )
  .or(
    z.object({
      depositUids: z.array(nonNegativeInt).max(1),
      type: z.literal(DepositToStorageUnitAction),
      uid: nonNegativeInt
    })
  )
  .or(
    z.object({
      retrieveUids: z.array(nonNegativeInt).max(1),
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
      itemId: nonNegativeInt,
      slot: nonNegativeInt,
      stickerUid: nonNegativeInt
    })
  )
  .or(
    z.object({
      type: z.literal(RemoveAllItemsAction)
    })
  );

export type ActionShape = z.infer<typeof actionShape>;
export type ApiActionSyncData = ReturnType<
  Awaited<ReturnType<typeof action>>["json"]
>;

async function enforceCraftRulesForItem(
  idOrItem: number | CS2EconomyItem,
  userId: string
) {
  const { category, type, model, id } = CS2Economy.get(idOrItem);
  await expectRuleNotContain("craftHideId", id, userId);
  if (category !== undefined) {
    await expectRuleNotContain("craftHideCategory", category, userId);
  }
  if (type !== undefined) {
    await expectRuleNotContain("craftHideType", type, userId);
  }
  if (model !== undefined) {
    await expectRuleNotContain("craftHideModel", model, userId);
  }
}

async function enforceCraftRulesForInventoryItem(
  { stickers, statTrak, wear, seed, nameTag }: Partial<CS2BaseInventoryItem>,
  userId: string
) {
  if (stickers !== undefined) {
    await expectRule("craftAllowStickers", true, userId);
    await expectRuleNotContain("craftHideType", CS2ItemType.Sticker, userId);
    for (const sticker of Object.values(stickers)) {
      await enforceCraftRulesForItem(sticker.id, userId);
    }
  }
  if (statTrak !== undefined) {
    await expectRule("craftAllowStatTrak", true, userId);
  }
  if (wear !== undefined) {
    await expectRule("craftAllowWear", true, userId);
  }
  if (seed !== undefined) {
    await expectRule("craftAllowSeed", true, userId);
  }
  if (nameTag !== undefined) {
    await expectRule("craftAllowNametag", true, userId);
  }
}

async function enforceEditRulesForItem(
  idOrItem: number | CS2EconomyItem,
  userId: string
) {
  const { category, type, model, id } = CS2Economy.get(idOrItem);
  await expectRuleNotContain("editHideId", id, userId);
  if (category !== undefined) {
    await expectRuleNotContain("editHideCategory", category, userId);
  }
  if (type !== undefined) {
    await expectRuleNotContain("editHideType", type, userId);
  }
  if (model !== undefined) {
    await expectRuleNotContain("editHideModel", model, userId);
  }
}

async function enforceEditRulesForInventoryItem(
  { stickers, statTrak, wear, seed, nameTag }: Partial<CS2BaseInventoryItem>,
  userId: string
) {
  if (stickers !== undefined) {
    await expectRule("editAllowStickers", true, userId);
    await expectRuleNotContain("editHideType", CS2ItemType.Sticker, userId);
    for (const sticker of Object.values(stickers)) {
      await enforceEditRulesForItem(sticker.id, userId);
    }
  }
  if (statTrak !== undefined) {
    await expectRule("editAllowStatTrak", true, userId);
  }
  if (wear !== undefined) {
    await expectRule("editAllowWear", true, userId);
  }
  if (seed !== undefined) {
    await expectRule("editAllowSeed", true, userId);
  }
  if (nameTag !== undefined) {
    await expectRule("editAllowNametag", true, userId);
  }
}

export async function action({ request }: ActionFunctionArgs) {
  await middleware(request);
  const domainHostname = getRequestHostname(request);
  const { id: userId, inventory: rawInventory } = await requireUser(request);
  const { syncedAt, actions } = z
    .object({
      syncedAt: z.number(),
      actions: z.array(actionShape)
    })
    .parse(await request.json());
  let addedFromCache = false;
  const { syncedAt: responseSyncedAt } = await manipulateUserInventory({
    domainHostname,
    rawInventory,
    syncedAt,
    userId,
    async manipulate(inventory) {
      for (const action of actions) {
        switch (action.type) {
          case AddAction:
            await enforceCraftRulesForInventoryItem(action.item, userId);
            await enforceCraftRulesForItem(action.item.id, userId);
            inventory.add(action.item);
            break;
          case AddFromCacheAction:
            if (rawInventory === null && !addedFromCache) {
              try {
                for (const item of new CS2Inventory({
                  data: { items: action.items, version: CS2_INVENTORY_VERSION },
                  maxItems: await getRule("inventoryMaxItems", userId),
                  storageUnitMaxItems: await getRule(
                    "inventoryStorageUnitMaxItems",
                    userId
                  )
                }).getAllAsBase()) {
                  await enforceCraftRulesForInventoryItem(item, userId);
                  await enforceCraftRulesForItem(item.id, userId);
                  inventory.add(item);
                }
              } catch {}
              addedFromCache = true;
            }
            break;
          case AddWithNametagAction:
            await enforceCraftRulesForItem(action.itemId, userId);
            inventory.addWithNametag(
              action.toolUid,
              action.itemId,
              action.nameTag
            );
            break;
          case ApplyItemStickerAction:
            await expectRule("inventoryItemAllowApplySticker", true, userId);
            inventory.applyItemSticker(
              action.targetUid,
              action.stickerUid,
              action.slot
            );
            break;
          case EquipAction:
            inventory.equip(action.uid, action.team);
            break;
          case UnequipAction:
            inventory.unequip(action.uid, action.team);
            break;
          case RenameItemAction:
            inventory.renameItem(
              action.toolUid,
              action.targetUid,
              action.nameTag
            );
            break;
          case RemoveAction:
            inventory.remove(action.uid);
            break;
          case ScrapeItemStickerAction:
            await expectRule("inventoryItemAllowScrapeSticker", true, userId);
            inventory.scrapeItemSticker(action.targetUid, action.slot);
            break;
          case SwapItemsStatTrakAction:
            inventory.swapItemsStatTrak(
              action.toolUid,
              action.fromUid,
              action.toUid
            );
            break;
          case RenameStorageUnitAction:
            inventory.renameStorageUnit(action.uid, action.nameTag);
            break;
          case DepositToStorageUnitAction:
            inventory.depositToStorageUnit(action.uid, action.depositUids);
            break;
          case RetrieveFromStorageUnitAction:
            inventory.retrieveFromStorageUnit(action.uid, action.retrieveUids);
            break;
          case EditAction:
            await expectRule("inventoryItemAllowEdit", true, userId);
            await enforceEditRulesForItem(action.attributes.id, userId);
            await enforceEditRulesForInventoryItem(action.attributes, userId);
            inventory.edit(action.uid, {
              ...action.attributes,
              statTrak:
                action.attributes.statTrak !== undefined
                  ? inventory.get(action.uid).statTrak ?? 0
                  : undefined,
              nameTag: action.attributes.nameTag
            });
            break;
          case AddWithStickerAction:
            await enforceCraftRulesForItem(action.itemId, userId);
            inventory.addWithSticker(
              action.stickerUid,
              action.itemId,
              action.slot
            );
            break;
          case RemoveAllItemsAction:
            inventory.removeAll();
            break;
        }
      }
    }
  });
  return json({ syncedAt: responseSyncedAt.getTime() });
}
