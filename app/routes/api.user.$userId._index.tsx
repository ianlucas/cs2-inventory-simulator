/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LoaderFunctionArgs, json } from "@remix-run/node";
import { z } from "zod";
import { prisma } from "~/db.server";
import { middleware } from "~/http.server";
import { isValidApiRequest } from "~/middlewares/is-valid-api-request.server";
import { API_SCOPE } from "~/models/api-credential.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  middleware(request);
  await isValidApiRequest(request, [API_SCOPE]);
  return json(
    await prisma.user.findUnique({
      include: {
        inventories: true,
        groups: true
      },
      where: {
        id: z.string().parse(params.userId)
      }
    })
  );
}
