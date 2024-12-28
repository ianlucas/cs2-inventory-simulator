/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { data } from "react-router";
import { api } from "~/api.server";
import { requireUser } from "~/auth.server";
import { middleware } from "~/http.server";
import { SerializeFrom } from "~/utils/misc";
import type { Route } from "./+types/api.action.resync._index";

export const ApiActionResyncUrl = "/api/action/resync";

export type ApiActionResyncData = SerializeFrom<typeof loader>;

export const loader = api(async ({ request }: Route.LoaderArgs) => {
  await middleware(request);
  const { syncedAt, inventory } = await requireUser(request);
  return data({
    syncedAt: syncedAt.getTime(),
    inventory
  });
});
