/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Inventory, CS_unlockCase } from "@ianlucas/cslib";
import { ActionFunctionArgs, json } from "@remix-run/node";
import { z } from "zod";
import { requireUser } from "~/auth.server";
import {
  MAX_INVENTORY_ITEMS,
  MAX_INVENTORY_STORAGE_UNIT_ITEMS
} from "~/env.server";
import { middleware } from "~/http.server";
import { updateUserInventory } from "~/models/user.server";
import { parseInventory } from "~/utils/inventory";

export const ApiActionUnlockCaseUrl = "/api/action/unlock-case";

export type ApiActionUnlockCaseActionData = ReturnType<
  Awaited<ReturnType<typeof action>>["json"]
>;

export async function action({ request }: ActionFunctionArgs) {
  await middleware(request);
  const { id: userId, inventory: rawInventory } = await requireUser(request);
  const { caseIndex, keyIndex } = z
    .object({
      caseIndex: z.number(),
      keyIndex: z.number().optional()
    })
    .parse(await request.json());
  const inventory = new CS_Inventory({
    items: parseInventory(rawInventory),
    limit: MAX_INVENTORY_ITEMS,
    storageUnitLimit: MAX_INVENTORY_STORAGE_UNIT_ITEMS
  });
  const unlockedItem = CS_unlockCase(inventory.get(caseIndex).id);
  inventory.unlockCase(unlockedItem, caseIndex, keyIndex);
  await updateUserInventory(userId, inventory.getAll());
  return json(unlockedItem);
}
