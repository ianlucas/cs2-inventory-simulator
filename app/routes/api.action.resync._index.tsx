/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LoaderFunctionArgs } from "@remix-run/node";
import { typedjson } from "remix-typedjson";
import { requireUser } from "~/auth.server";
import { middleware } from "~/http.server";

export const ApiActionResyncUrl = "/api/action/resync";
export type ApiActionResyncData = ReturnType<
  Awaited<ReturnType<typeof loader>>["json"]
>;

export async function loader({ request }: LoaderFunctionArgs) {
  await middleware(request);
  const { syncedAt, inventory } = await requireUser(request);
  return typedjson({
    syncedAt: syncedAt.getTime(),
    inventory
  });
}
