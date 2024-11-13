/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LoaderFunctionArgs } from "@remix-run/node";
import { api } from "~/api.server";
import { requireUser } from "~/auth.server";
import { middleware } from "~/http.server";
import { json, SerializeFrom } from "~/utils/misc";

export const ApiActionResyncUrl = "/api/action/resync";

export type ApiActionResyncData = SerializeFrom<typeof loader>;

export const loader = api(async ({ request }: LoaderFunctionArgs) => {
  await middleware(request);
  const { syncedAt, inventory } = await requireUser(request);
  return json({
    syncedAt: syncedAt.getTime(),
    inventory
  });
});
