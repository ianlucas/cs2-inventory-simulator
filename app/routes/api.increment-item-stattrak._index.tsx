/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { middleware } from "~/http.server";
import {
  API_SCOPE,
  STATTRAK_INCREMENT_SCOPE,
  isApiKeyValid
} from "~/models/api-credential.server";
import { getRequestHostname } from "~/models/domain.server";
import {
  existsUser,
  findUniqueUser,
  manipulateUserInventory
} from "~/models/user.server";
import {
  badRequest,
  noContent,
  notFound,
  unauthorized
} from "~/response.server";
import { nonNegativeInt } from "~/utils/shapes";

export async function action({ request }: ActionFunctionArgs) {
  await middleware(request);
  if (request.method !== "POST") {
    throw notFound;
  }
  const domainHostname = getRequestHostname(request);
  const { apiKey, userId, targetUid } = z
    .object({
      apiKey: z.string(),
      userId: z.string(),
      targetUid: nonNegativeInt
    })
    .parse(await request.json());

  if (!(await isApiKeyValid(apiKey, [API_SCOPE, STATTRAK_INCREMENT_SCOPE]))) {
    throw unauthorized;
  }

  if (!(await existsUser(userId))) {
    throw badRequest;
  }

  try {
    const { inventory: rawInventory } = await findUniqueUser(
      domainHostname,
      userId
    );
    await manipulateUserInventory({
      domainHostname,
      rawInventory,
      userId,
      manipulate(inventory) {
        inventory.incrementItemStatTrak(targetUid);
      }
    });
    return noContent;
  } catch {
    return badRequest;
  }
}
