/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { handleUserCachedResponse } from "~/models/user-cache.server";
import { transformEquipped } from "~/utils/inventory";
import { toValveKeyValue } from "~/utils/valve-key-value";

export const ApiEquippedUserIdCfgUrl = "/api/equipped/$userId.cfg";

export async function loader({ params }: LoaderFunctionArgs) {
  const userId = z.string().parse(params.userId);
  return await handleUserCachedResponse({
    generate(inventory) {
      return toValveKeyValue(transformEquipped(inventory));
    },
    mimeType: "text/plain",
    throwBody: "",
    url: ApiEquippedUserIdCfgUrl,
    userId
  });
}
