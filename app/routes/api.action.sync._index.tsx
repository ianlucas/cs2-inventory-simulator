/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { requireUser } from "~/auth.server";
import { manipulateUserInventory } from "~/models/user.server";
import { noContent } from "~/response.server";
import {
  craftInventoryItemShape,
  craftInventoryShape,
  teamShape
} from "~/utils/shapes";

export const ApiActionSync = "/api/action/sync";

export async function action({ request }: ActionFunctionArgs) {
  const { id: userId, inventory: rawInventory } = await requireUser(request);
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
            team: teamShape.optional()
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
            team: teamShape.optional()
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
        .or(
          z.object({
            type: z.literal("create-from-cache"),
            items: craftInventoryShape
          })
        )
    )
    .parse(await request.json());
  await manipulateUserInventory(userId, rawInventory, (inventory) =>
    actions.forEach((action) => {
      switch (action.type) {
        case "create-from-cache":
          return action.items.forEach((item) => inventory.add(item));
        case "add":
          return inventory.add(action.item);
        case "equip":
          return inventory.equip(action.index, action.team);
        case "remove":
          return inventory.remove(action.index);
        case "unequip":
          return inventory.unequip(action.index, action.team);
        case "renameItem":
          return inventory.renameItem(
            action.toolIndex,
            action.targetIndex,
            action.nametag
          );
      }
    })
  );
  return noContent;
}
