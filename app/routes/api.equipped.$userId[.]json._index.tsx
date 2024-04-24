/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { middleware } from "~/http.server";
import { getRequestHostname } from "~/models/domain.server";
import { handleUserCachedResponse } from "~/models/user-cache.server";
import { generate } from "~/utils/inventory-equipped";

export const ApiEquippedUserIdJsonUrl = "/api/equipped/$userId.json";

export async function loader({ params, request }: LoaderFunctionArgs) {
  await middleware(request);
  const domainHostname = getRequestHostname(request);
  const userId = z.string().parse(params.userId);
  return await handleUserCachedResponse({
    args: domainHostname,
    generate,
    mimeType: "application/json",
    domainHostname,
    throwBody: {},
    url: ApiEquippedUserIdJsonUrl,
    userId
  });
}
