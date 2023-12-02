/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { requireUser } from "~/auth.server";
import { manipulateUserInventory } from "~/models/user.server";
import { noContent } from "~/response.server";
import { craftInventoryItemShape, csTeamShape } from "~/utils/shapes";

export const ApiActionSync = "/api/action/sync";

export async function action({ request }: ActionFunctionArgs) {
  const { id: userId, inventory } = await requireUser(request);
  const actions = z
    .array(
      z
        .object({
          type: z.literal("add"),
          item: craftInventoryItemShape
        })
        .or(
          z.object({
            type: z.literal("equip"),
            index: z.number(),
            csTeam: csTeamShape.optional()
          })
        )
        .or(
          z.object({
            type: z.literal("remove"),
            index: z.number()
          })
        )
        .or(
          z.object({
            type: z.literal("unequip"),
            index: z.number(),
            csTeam: csTeamShape.optional()
          })
        )
        .or(
          z.object({
            type: z.literal("renameItem"),
            toolIndex: z.number(),
            targetIndex: z.number(),
            nametag: z.string().optional()
          })
        )
    )
    .parse(await request.json());
  await manipulateUserInventory(userId, inventory, (csInventory) =>
    actions.forEach((action) => {
      switch (action.type) {
        case "add":
          return csInventory.add(action.item);
        case "equip":
          return csInventory.equip(action.index, action.csTeam);
        case "remove":
          return csInventory.remove(action.index);
        case "unequip":
          return csInventory.unequip(action.index, action.csTeam);
        case "renameItem":
          return csInventory.renameItem(
            action.toolIndex,
            action.targetIndex,
            action.nametag
          );
      }
    })
  );
  return noContent;
}
