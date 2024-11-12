/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { api } from "~/api.server";
import { middleware } from "~/http.server";
import { generateAuthToken } from "~/models/api-auth-token.server";
import { API_AUTH_SCOPE, isApiKeyValid } from "~/models/api-credential.server";
import { existsUser } from "~/models/user.server";
import { badRequest, methodNotAllowed, unauthorized } from "~/responses.server";

export const action = api(async ({ request }: ActionFunctionArgs) => {
  await middleware(request);
  if (request.method !== "POST") {
    throw methodNotAllowed;
  }
  const { apiKey, userId } = z
    .object({
      apiKey: z.string(),
      userId: z.string()
    })
    .parse(await request.json());

  if (!(await isApiKeyValid(apiKey, [API_AUTH_SCOPE]))) {
    throw unauthorized;
  }

  if (!(await existsUser(userId))) {
    throw badRequest;
  }
  return {
    token: await generateAuthToken({ apiKey, userId })
  };
});
