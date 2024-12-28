/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { fail } from "@ianlucas/cs2-lib";
import { Strategy } from "remix-auth/strategy";
import SteamAPI, { UserSummary } from "steamapi";
import { z } from "zod";
import {
  clearAuthTokens,
  clearExpiredAuthTokens,
  getAuthTokenDetails
} from "./models/api-auth-token.server";
import { steamApiKey } from "./models/rule.server";
import { upsertUser } from "./models/user.server";

namespace ApiStrategy {
  export type VerifyOptions = {
    request: Request;
    userId: string;
  };
}

export class ApiStrategy extends Strategy<string, ApiStrategy.VerifyOptions> {
  name = "api";

  constructor() {
    super(
      async ({ userId }) =>
        await upsertUser(
          (await new SteamAPI(await steamApiKey.get()).getUserSummary(
            userId
          )) as UserSummary
        )
    );
  }

  async authenticate(request: Request) {
    const url = new URL(request.url);
    const token = z.string().parse(url.searchParams.get("token"));
    const { exists, userId, valid } = await getAuthTokenDetails(token);

    if (!exists) {
      fail("Invalid token.");
    }

    if (!valid) {
      await clearExpiredAuthTokens(userId);
      fail("Expired token.");
    }

    await clearAuthTokens(userId);

    return await this.verify({ userId, request });
  }
}
