/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { api } from "~/api.server";
import { requireUser } from "~/auth.server";
import { middleware } from "~/middleware.server";
import { getUserLoadouts } from "~/models/user-loadout.server";
import type { UserLoadouts } from "~/shared/user-loadouts";
import type { Route } from "./+types/api.action.resync._index";

export const ApiActionResyncUrl = "/api/action/resync";

export type ApiActionResyncData = {
  syncedAt: number;
  inventory: string | null;
  loadouts: UserLoadouts;
};

export const loader = api(async ({ request }: Route.LoaderArgs) => {
  await middleware(request);
  const { id: userId, syncedAt, inventory } = await requireUser(request);
  return Response.json({
    syncedAt: syncedAt.getTime(),
    inventory,
    loadouts: await getUserLoadouts(userId)
  } satisfies ApiActionResyncData);
});
