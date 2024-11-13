/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { api } from "~/api.server";
import { prisma } from "~/db.server";
import { middleware } from "~/http.server";
import { isValidApiRequest } from "~/middlewares/is-valid-api-request.server";
import { API_SCOPE } from "~/models/api-credential.server";
import { json } from "~/utils/misc";

export const loader = api(async ({ request, params }: LoaderFunctionArgs) => {
  middleware(request);
  await isValidApiRequest(request, [API_SCOPE]);
  return json(
    await prisma.user.findUnique({
      include: {
        groups: true
      },
      where: {
        id: z.string().parse(params.userId)
      }
    })
  );
});
