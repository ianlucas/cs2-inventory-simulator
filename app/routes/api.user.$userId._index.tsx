/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { api } from "~/api.server";
import { prisma } from "~/db.server";
import { middleware } from "~/http.server";
import { isValidApiRequest } from "~/middlewares/is-valid-api-request.server";
import { API_SCOPE } from "~/models/api-credential.server";
import type { Route } from "./+types/api.user.$userId._index";

export const loader = api(
  async ({ request, params: { userId } }: Route.LoaderArgs) => {
    await middleware(request);
    await isValidApiRequest(request, [API_SCOPE]);
    return Response.json(
      await prisma.user.findUnique({
        include: {
          groups: true
        },
        where: {
          id: userId
        }
      })
    );
  }
);
