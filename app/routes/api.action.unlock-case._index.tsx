/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Inventory } from "@ianlucas/cslib";
import { ActionFunctionArgs, json } from "@remix-run/node";
import { z } from "zod";
import { requireUser } from "~/auth.server";
import { prisma } from "~/db.server";
import { MAX_INVENTORY_ITEMS } from "~/env.server";
import { badRequest } from "~/response.server";
import { parseInventory } from "~/utils/inventory";

export const ApiActionUnlockCaseUrl = "/api/action/unlock-case";

export async function action({ request }: ActionFunctionArgs) {
  const { id: userId, inventory: rawInventory } = await requireUser(request);
  const { caseIndex, keyIndex } = z
    .object({
      caseIndex: z.number(),
      keyIndex: z.number().optional()
    })
    .parse(await request.json());
  const inventory = new CS_Inventory(
    parseInventory(rawInventory),
    MAX_INVENTORY_ITEMS
  );
  try {
    const unlockedItem = inventory.unlockCase(caseIndex, keyIndex);
    await prisma.user.update({
      data: {
        inventory: JSON.stringify(inventory.getAll())
      },
      where: { id: userId }
    });
    return json(unlockedItem);
  } catch {
    throw badRequest;
  }
}
