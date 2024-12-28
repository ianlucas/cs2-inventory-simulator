/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { api } from "~/api.server";
import { middleware } from "~/http.server";
import type { Route } from "./+types/api.$";

export const loader = api(async ({ request }: Route.LoaderArgs) => {
  middleware(request);
  return Response.json(
    {
      message:
        "Resource not found, please refer to https://github.com/ianlucas/cs2-inventory-simulator/blob/main/docs/api.md."
    },
    {
      status: 404
    }
  );
});
