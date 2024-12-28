/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { api } from "~/api.server";
import { requireUser } from "~/auth.server";
import { middleware } from "~/http.server";
import type { Route } from "./+types/api.action.resync._index";

export const ApiActionResyncUrl = "/api/action/resync";

export type ApiActionResyncData = {
  syncedAt: number;
  inventory: string | null;
};

export const loader = api(async ({ request }: Route.LoaderArgs) => {
  await middleware(request);
  const { syncedAt, inventory } = await requireUser(request);
  return Response.json({
    syncedAt: syncedAt.getTime(),
    inventory
  } satisfies ApiActionResyncData);
});
