/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Inventory } from "@ianlucas/cs2-lib";
import { api } from "~/api.server";
import { requireUser } from "~/auth.server";
import { middleware } from "~/middleware.server";
import { updateUserInventory } from "~/models/user.server";
import { methodNotAllowed, noContent } from "~/responses.server";
import type { Route } from "./+types/api.action.reset-inventory._index";

export const ApiActionResetInventoryUrl = "/api/action/reset-inventory";

export const action = api(async ({ request }: Route.ActionArgs) => {
  await middleware(request);
  if (request.method !== "POST") {
    throw methodNotAllowed;
  }
  const { id: userId } = await requireUser(request);
  await updateUserInventory(userId, new CS2Inventory().stringify());
  return noContent;
});

export { loader } from "./api.$";
