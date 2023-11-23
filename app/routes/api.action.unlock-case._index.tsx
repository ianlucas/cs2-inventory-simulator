/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_MutableInventory } from "@ianlucas/cslib";
import { ActionFunctionArgs, json } from "@remix-run/node";
import { z } from "zod";
import { requireUser } from "~/auth.server";
import { prisma } from "~/db.server";
import { MAX_INVENTORY_ITEMS } from "~/env.server";
import { badRequest } from "~/response.server";
import { parseInventory } from "~/utils/inventory";

export const ApiActionUnlockCaseUrl = "/api/action/unlock-case";

export async function action({ request }: ActionFunctionArgs) {
  const { id: userId, inventory } = await requireUser(request);
  const { caseIndex, keyIndex } = z.object({
    caseIndex: z.number(),
    keyIndex: z.number().optional()
  }).parse(await request.json());
  const csInventory = new CS_MutableInventory(
    parseInventory(inventory),
    MAX_INVENTORY_ITEMS
  );
  const { rolledItem } = csInventory.unlockCase(caseIndex, keyIndex);
  try {
    await prisma.user.update({
      data: {
        inventory: JSON.stringify(csInventory.getItems())
      },
      where: { id: userId }
    });
    return json(rolledItem);
  } catch {
    throw badRequest;
  }
}
