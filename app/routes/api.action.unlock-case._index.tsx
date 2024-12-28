/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Inventory, CS2UnlockedItem } from "@ianlucas/cs2-lib";
import { z } from "zod";
import { api } from "~/api.server";
import { requireUser } from "~/auth.server";
import { middleware } from "~/http.server";
import {
  inventoryItemAllowUnlockContainer,
  inventoryMaxItems,
  inventoryStorageUnitMaxItems
} from "~/models/rule.server";
import { updateUserInventory } from "~/models/user.server";
import { conflict, methodNotAllowed } from "~/responses.server";
import { parseInventory } from "~/utils/inventory";
import { nonNegativeInt, positiveInt } from "~/utils/shapes";
import type { Route } from "./+types/api.action.unlock-case._index";

export const ApiActionUnlockCaseUrl = "/api/action/unlock-case";

export type ApiActionUnlockCaseActionData = {
  syncedAt: number;
  unlockedItem: CS2UnlockedItem;
};

export const action = api(async ({ request }: Route.ActionArgs) => {
  await middleware(request);
  if (request.method !== "POST") {
    throw methodNotAllowed;
  }
  const {
    id: userId,
    inventory: rawInventory,
    syncedAt: currentSyncedAt
  } = await requireUser(request);
  await inventoryItemAllowUnlockContainer.for(userId).truthy();
  const { caseUid, keyUid, syncedAt } = z
    .object({
      syncedAt: positiveInt,
      caseUid: nonNegativeInt,
      keyUid: nonNegativeInt.optional()
    })
    .parse(await request.json());
  if (syncedAt !== currentSyncedAt.getTime()) {
    throw conflict;
  }
  const inventory = new CS2Inventory({
    data: parseInventory(rawInventory),
    maxItems: await inventoryMaxItems.for(userId).get(),
    storageUnitMaxItems: await inventoryStorageUnitMaxItems.for(userId).get()
  });
  const unlockedItem = inventory.get(caseUid).unlockContainer();
  inventory.unlockContainer(unlockedItem, caseUid, keyUid);
  const { syncedAt: responseSyncedAt } = await updateUserInventory(
    userId,
    inventory.stringify()
  );

  return Response.json({
    unlockedItem,
    syncedAt: responseSyncedAt.getTime()
  } satisfies ApiActionUnlockCaseActionData);
});

export { loader } from "./api.$";
