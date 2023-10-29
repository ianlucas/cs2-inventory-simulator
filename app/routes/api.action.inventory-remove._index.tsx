/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { requireUser } from "~/auth.server";
import { editUserInventory } from "~/models/user.server";
import { noContent } from "~/response.server";

export const ApiActionInventoryRemoveUrl = "/api/action/inventory-remove";

export async function action({ request }: ActionFunctionArgs) {
  const { id: userId, inventory } = await requireUser(request);
  const { index } = z.object({
    index: z.number()
  }).parse(await request.json());
  await editUserInventory(
    userId,
    inventory,
    csInventory => {
      return csInventory.remove(index);
    }
  );
  return noContent;
}
