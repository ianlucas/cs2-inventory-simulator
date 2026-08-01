/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { assert } from "@ianlucas/cs2-lib";
import { z } from "zod";
import { api } from "~/api.server";
import { middleware } from "~/middleware.server";
import {
  API_SCOPE,
  SPRAY_CONSUME_SCOPE,
  isApiKeyValid
} from "~/models/api-credential.server";
import {
  existsUser,
  findUniqueUser,
  manipulateUserInventory
} from "~/models/user.server";
import {
  badRequest,
  methodNotAllowed,
  noContent,
  unauthorized
} from "~/responses.server";
import { nonNegativeInt } from "~/utils/shapes";
import type { Route } from "./+types/api.consume-item-spray._index";

export const action = api(async ({ request }: Route.ActionArgs) => {
  await middleware(request);
  if (request.method !== "POST") {
    throw methodNotAllowed;
  }
  const { apiKey, userId, targetUid } = z
    .object({
      apiKey: z.string(),
      userId: z.string(),
      targetUid: nonNegativeInt
    })
    .parse(await request.json());

  if (!(await isApiKeyValid(apiKey, [API_SCOPE, SPRAY_CONSUME_SCOPE]))) {
    throw unauthorized;
  }

  if (!(await existsUser(userId))) {
    throw badRequest;
  }

  try {
    const { inventory: rawInventory } = await findUniqueUser(userId);
    await manipulateUserInventory({
      rawInventory,
      userId,
      manipulate(inventory) {
        const item = inventory.get(targetUid);
        assert(item.isGraffiti());
        assert(item.equipped === true);
        inventory.consumeItemCharges(targetUid);
      }
    });
    return noContent;
  } catch {
    return badRequest;
  }
});

export { loader } from "./api.$";
