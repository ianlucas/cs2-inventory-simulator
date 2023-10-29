/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ActionFunctionArgs } from "@remix-run/node";
import { CS_Inventory } from "cslib";
import { requireUser } from "~/auth.server";
import { MAX_INVENTORY_ITEMS } from "~/env.server";
import { updateUserInventory } from "~/models/user.server";
import { noContent, notFound } from "~/response.server";
import { inventoryShape } from "~/utils/shapes";

export const ApiSaveCachedInventoryUrl = "/api/save-cached-inventory";

export async function action({ request }: ActionFunctionArgs) {
  const { id: userId, inventory: userInventory } = await requireUser(request);
  if (userInventory !== null) {
    return notFound;
  }
  const items = inventoryShape.parse(await request.json());
  let inventory = new CS_Inventory([], MAX_INVENTORY_ITEMS);
  items.forEach(item => {
    inventory = inventory.add(item);
  });
  await updateUserInventory(userId, inventory.getItems());
  return noContent;
}
