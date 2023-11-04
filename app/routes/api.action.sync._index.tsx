/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { requireUser } from "~/auth.server";
import { editUserInventory } from "~/models/user.server";
import { noContent } from "~/response.server";
import { csTeamShape, inventoryItemShape } from "~/utils/shapes";

export const ApiActionSync = "/api/action/sync";

export async function action({ request }: ActionFunctionArgs) {
  const { id: userId, inventory } = await requireUser(request);
  const actions = z.array(
    z.object({
      type: z.literal("add"),
      item: inventoryItemShape
    }).or(z.object({
      type: z.literal("equip"),
      index: z.number(),
      csTeam: csTeamShape.optional()
    })).or(z.object({
      type: z.literal("remove"),
      index: z.number()
    })).or(z.object({
      type: z.literal("unequip"),
      index: z.number(),
      csTeam: csTeamShape.optional()
    }))
  )
    .parse(await request.json());
  await editUserInventory(
    userId,
    inventory,
    csInventory => {
      for (const action of actions) {
        switch (action.type) {
          case "add":
            csInventory = csInventory.add(action.item);
            break;

          case "equip":
            csInventory = csInventory.equip(action.index, action.csTeam);
            break;

          case "remove":
            csInventory = csInventory.remove(action.index);
            break;

          case "unequip":
            csInventory = csInventory.unequip(action.index, action.csTeam);
            break;
        }
      }
      return csInventory;
    }
  );
  return noContent;
}
