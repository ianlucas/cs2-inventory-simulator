/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ActionFunctionArgs, json } from "@remix-run/node";
import { z } from "zod";
import { middleware } from "~/http.server";
import { generateAuthToken } from "~/models/api-auth-token.server";
import {
  API_AUTH_SCOPE,
  API_SCOPE,
  isApiKeyValid
} from "~/models/api-credential.server";
import { existsUser } from "~/models/user.server";
import { badRequest, notFound, unauthorized } from "~/response.server";

export async function action({ request }: ActionFunctionArgs) {
  await middleware(request);
  if (request.method !== "POST") {
    throw notFound;
  }
  const { apiKey, userId } = z
    .object({
      apiKey: z.string(),
      userId: z.string()
    })
    .parse(await request.json());

  if (!(await isApiKeyValid(apiKey, [API_SCOPE, API_AUTH_SCOPE]))) {
    throw unauthorized;
  }

  if (!(await existsUser(userId))) {
    throw badRequest;
  }

  return json({
    token: await generateAuthToken({ apiKey, userId })
  });
}
