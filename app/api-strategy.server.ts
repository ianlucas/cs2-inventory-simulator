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

type ApiStrategyVerifyOptions = {
  request: Request;
  userId: string;
};

export class ApiStrategy extends Strategy<string, ApiStrategyVerifyOptions> {
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
    const { details, valid } = await getAuthTokenDetails(token);
    if (!details) {
      fail("Invalid token.");
    }
    if (!valid) {
      await clearExpiredAuthTokens(details.userId);
      fail("Expired token.");
    }
    await clearAuthTokens(details.userId);
    return await this.verify({ userId: details.userId, request });
  }
}
