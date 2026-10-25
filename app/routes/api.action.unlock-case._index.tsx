/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem, CS2UnlockedItem } from "@ianlucas/cs2-lib";
import { z } from "zod";
import { api } from "~/api.server";
import { requireUser } from "~/auth.server";
import { middleware } from "~/middleware.server";
import {
  appShowCommunity,
  communityWeeklyBudget,
  inventoryItemAllowUnlockContainer
} from "~/models/rule.server";
import { recordUserUnlock } from "~/models/user-unlock.server";
import { manipulateUserInventory } from "~/models/user.server";
import { badRequest, methodNotAllowed } from "~/responses.server";
import { nonNegativeInt, positiveInt } from "~/shared/shapes";
import type { UnboxingResult } from "~/shared/unboxing-league";
import { announceUnlockedItem } from "~/unlock-feed.server";
import type { Route } from "./+types/api.action.unlock-case._index";

export const ApiActionUnlockCaseUrl = "/api/action/unlock-case";

export type ApiActionUnlockCaseActionData = {
  syncedAt: number;
  unboxing?: UnboxingResult;
  unlockedItem: CS2UnlockedItem;
};

export const action = api(async ({ request }: Route.ActionArgs) => {
  await middleware(request);
  if (request.method !== "POST") {
    throw methodNotAllowed;
  }
  const user = await requireUser(request);
  await inventoryItemAllowUnlockContainer.for(user.id).truthy();
  const { caseUid, keyUid, syncedAt } = z
    .object({
      syncedAt: positiveInt,
      caseUid: nonNegativeInt,
      keyUid: nonNegativeInt.optional()
    })
    .parse(await request.json());
  const [isLeagueOn, budget] = await Promise.all([
    appShowCommunity.for(user.id).get(),
    communityWeeklyBudget.get()
  ]);
  let container: CS2EconomyItem | undefined;
  let keyId: number | undefined;
  let unlockedItem: CS2UnlockedItem | undefined;
  let unboxing: UnboxingResult | undefined;
  const { syncedAt: responseSyncedAt } = await manipulateUserInventory({
    syncedAt,
    userId: user.id,
    manipulate(inventory) {
      container = inventory.get(caseUid);
      keyId = keyUid !== undefined ? inventory.get(keyUid).id : undefined;
      unlockedItem = container.unlockContainer();
      inventory.unlockContainer(unlockedItem, caseUid, keyUid);
    },
    async onSave(tx) {
      if (isLeagueOn && container !== undefined && unlockedItem !== undefined) {
        unboxing = await recordUserUnlock(tx, {
          budget,
          container,
          keyId,
          now: new Date(),
          unlockedItem,
          userId: user.id
        });
      }
    }
  });
  if (unlockedItem === undefined) {
    throw badRequest;
  }
  void announceUnlockedItem(user, unlockedItem);

  return Response.json({
    unboxing,
    unlockedItem,
    syncedAt: responseSyncedAt.getTime()
  } satisfies ApiActionUnlockCaseActionData);
});

export { loader } from "./api.$";
