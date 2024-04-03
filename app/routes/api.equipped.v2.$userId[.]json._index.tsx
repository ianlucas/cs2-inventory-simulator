/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { middleware } from "~/http.server";
import { handleUserCachedResponse } from "~/models/user-cache.server";
import { generate } from "~/utils/inventory-equipped-v2";

export const ApiEquippedUserIdJsonUrl = "/api/equipped/v2/$userId.json";

export async function loader({ params, request }: LoaderFunctionArgs) {
  await middleware(request);
  const userId = z.string().parse(params.userId);
  return await handleUserCachedResponse({
    generate,
    mimeType: "application/json",
    throwBody: {},
    url: ApiEquippedUserIdJsonUrl,
    userId
  });
}
