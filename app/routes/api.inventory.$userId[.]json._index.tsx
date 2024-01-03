/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { middleware } from "~/http";
import { handleUserCachedResponse } from "~/models/user-cache.server";

export const ApiInventoryUserIdUrl = "/api/inventory/$userId.json";

export async function loader({ params, request }: LoaderFunctionArgs) {
  await middleware(request);
  const userId = z.string().parse(params.userId);
  return await handleUserCachedResponse({
    generate(inventory) {
      return inventory;
    },
    mimeType: "application/json",
    throwBody: [],
    url: ApiInventoryUserIdUrl,
    userId
  });
}
