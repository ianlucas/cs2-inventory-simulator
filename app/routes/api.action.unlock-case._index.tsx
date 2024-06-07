/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Inventory } from "@ianlucas/cs2-lib";
import { ActionFunctionArgs, json } from "@remix-run/node";
import { z } from "zod";
import { requireUser } from "~/auth.server";
import { middleware } from "~/http.server";
import { getRequestHostname } from "~/models/domain.server";
import { expectRule, getRule } from "~/models/rule.server";
import { updateUserInventory } from "~/models/user.server";
import { conflict } from "~/response.server";
import { parseInventory } from "~/utils/inventory";
import { nonNegativeInt, positiveInt } from "~/utils/shapes";

export const ApiActionUnlockCaseUrl = "/api/action/unlock-case";

export type ApiActionUnlockCaseActionData = ReturnType<
  Awaited<ReturnType<typeof action>>["json"]
>;

export async function action({ request }: ActionFunctionArgs) {
  await middleware(request);
  const domainHostname = getRequestHostname(request);
  const {
    id: userId,
    inventory: rawInventory,
    syncedAt: currentSyncedAt
  } = await requireUser(request);
  await expectRule("inventoryItemAllowUnlockContainer", true, userId);
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
    maxItems: await getRule("inventoryMaxItems", userId),
    storageUnitMaxItems: await getRule("inventoryStorageUnitMaxItems", userId)
  });
  const unlockedItem = inventory.get(caseUid).unlockContainer();
  inventory.unlockContainer(unlockedItem, caseUid, keyUid);
  const { syncedAt: responseSyncedAt } = await updateUserInventory(
    domainHostname,
    userId,
    inventory.stringify()
  );
  return json({
    unlockedItem,
    syncedAt: responseSyncedAt.getTime()
  });
}
