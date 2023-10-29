/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LoaderFunctionArgs } from "@remix-run/node";
import { CS_Economy } from "cslib";
import { z } from "zod";
import { useUserCache } from "~/models/user-cache.server";

export const ApiInventoryUserIdUrl = "/api/inventory/$userId";

export async function loader({ params }: LoaderFunctionArgs) {
  const userId = z.string().parse(params.userId);
  return await useUserCache({
    generate(inventory) {
      return inventory.map(item => ({
        ...item,
        ...CS_Economy.getDefById(item.id)
      }));
    },
    mimeType: "application/json",
    throwData: [],
    url: ApiInventoryUserIdUrl,
    userId
  });
}
