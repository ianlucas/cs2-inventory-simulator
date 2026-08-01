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
  SPRAY_CONSUME_RATE_LIMIT,
  consumeRateLimitToken
} from "~/models/rate-limit.server";
import { apiPublicSprayConsume } from "~/models/rule.server";
import { existsUser, manipulateUserInventory } from "~/models/user.server";
import {
  badRequest,
  methodNotAllowed,
  noContent,
  tooManyRequests,
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
      apiKey: z.string().optional(),
      userId: z.string(),
      targetUid: nonNegativeInt
    })
    .parse(await request.json());

  if (apiKey !== undefined) {
    if (!(await isApiKeyValid(apiKey, [API_SCOPE, SPRAY_CONSUME_SCOPE]))) {
      throw unauthorized;
    }
  } else {
    if (!(await apiPublicSprayConsume.for(userId).get())) {
      throw unauthorized;
    }
    if (
      !(await consumeRateLimitToken(
        `spray:${userId}:${targetUid}`,
        SPRAY_CONSUME_RATE_LIMIT
      ))
    ) {
      throw tooManyRequests;
    }
  }

  if (!(await existsUser(userId))) {
    throw badRequest;
  }

  try {
    await manipulateUserInventory({
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
