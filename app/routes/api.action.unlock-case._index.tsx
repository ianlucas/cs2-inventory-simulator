/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2UnlockedItem } from "@ianlucas/cs2-lib";
import { z } from "zod";
import { api } from "~/api.server";
import { requireUser } from "~/auth.server";
import { middleware } from "~/middleware.server";
import { inventoryItemAllowUnlockContainer } from "~/models/rule.server";
import { manipulateUserInventory } from "~/models/user.server";
import { badRequest, methodNotAllowed } from "~/responses.server";
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
  const { id: userId } = await requireUser(request);
  await inventoryItemAllowUnlockContainer.for(userId).truthy();
  const { caseUid, keyUid, syncedAt } = z
    .object({
      syncedAt: positiveInt,
      caseUid: nonNegativeInt,
      keyUid: nonNegativeInt.optional()
    })
    .parse(await request.json());
  let unlockedItem: CS2UnlockedItem | undefined;
  const { syncedAt: responseSyncedAt } = await manipulateUserInventory({
    syncedAt,
    userId,
    manipulate(inventory) {
      unlockedItem = inventory.get(caseUid).unlockContainer();
      inventory.unlockContainer(unlockedItem, caseUid, keyUid);
    }
  });
  if (unlockedItem === undefined) {
    throw badRequest;
  }

  return Response.json({
    unlockedItem,
    syncedAt: responseSyncedAt.getTime()
  } satisfies ApiActionUnlockCaseActionData);
});

export { loader } from "./api.$";
