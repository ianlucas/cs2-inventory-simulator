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
  STATTRAK_INCREMENT_SCOPE,
  isApiKeyValid
} from "~/models/api-credential.server";
import {
  STATTRAK_INCREMENT_RATE_LIMIT,
  consumeRateLimitToken
} from "~/models/rate-limit.server";
import { apiPublicStatTrakIncrement } from "~/models/rule.server";
import { existsUser, manipulateUserInventory } from "~/models/user.server";
import {
  badRequest,
  methodNotAllowed,
  noContent,
  tooManyRequests,
  unauthorized
} from "~/responses.server";
import { nonNegativeInt } from "~/utils/shapes";
import type { Route } from "./+types/api.increment-item-stattrak._index";

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
    if (!(await isApiKeyValid(apiKey, [API_SCOPE, STATTRAK_INCREMENT_SCOPE]))) {
      throw unauthorized;
    }
  } else {
    if (!(await apiPublicStatTrakIncrement.for(userId).get())) {
      throw unauthorized;
    }
    if (
      !(await consumeRateLimitToken(
        `stattrak:${userId}:${targetUid}`,
        STATTRAK_INCREMENT_RATE_LIMIT
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
        assert(
          item.equipped === true ||
            item.equippedCT === true ||
            item.equippedT === true
        );
        inventory.incrementItemStatTrak(targetUid);
      }
    });
    return noContent;
  } catch {
    return badRequest;
  }
});

export { loader } from "./api.$";
