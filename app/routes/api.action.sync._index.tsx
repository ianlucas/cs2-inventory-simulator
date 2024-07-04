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
import { ActionFunctionArgs, SerializeFrom, json } from "@remix-run/node";
import { z } from "zod";
import { api } from "~/api.server";
import { requireUser } from "~/auth.server";
import { SyncAction } from "~/data/sync";
import { middleware } from "~/http.server";
import { expectRule, expectRuleNotContain } from "~/models/rule.server";
import { manipulateUserInventory } from "~/models/user.server";
import { methodNotAllowed } from "~/responses.server";
import { nonNegativeInt, teamShape } from "~/utils/shapes";
import {
  clientInventoryItemShape,
  syncInventoryShape
} from "~/utils/shapes.server";

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

export type ApiActionSyncData = SerializeFrom<typeof action>;

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

export const action = api(async ({ request }: ActionFunctionArgs) => {
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
            await expectRule("inventoryItemAllowApplyPatch", true, userId);
            inventory.applyItemPatch(
              action.targetUid,
              action.patchUid,
              action.slot
            );
            break;
          case SyncAction.ApplyItemSticker:
            await expectRule("inventoryItemAllowApplySticker", true, userId);
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
            await expectRule("inventoryItemAllowRemovePatch", true, userId);
            inventory.removeItemPatch(action.targetUid, action.slot);
            break;
          case SyncAction.ScrapeItemSticker:
            await expectRule("inventoryItemAllowScrapeSticker", true, userId);
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
  return json({
    syncedAt: responseSyncedAt.getTime()
  });
});
