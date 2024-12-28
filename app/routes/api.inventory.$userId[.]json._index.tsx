/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { api } from "~/api.server";
import { middleware } from "~/http.server";
import { handleUserCachedResponse } from "~/models/user-cache.server";
import type { Route } from "./+types/api.inventory.$userId[.]json._index";

export const ApiInventoryUserIdUrl = "/api/inventory/$userId.json";

export const loader = api(
  async ({ params: { userId }, request }: Route.LoaderArgs) => {
    await middleware(request);
    return await handleUserCachedResponse({
      args: null,
      generate(inventory) {
        return inventory;
      },
      mimeType: "application/json",
      throwBody: [],
      url: ApiInventoryUserIdUrl,
      userId
    });
  }
);
