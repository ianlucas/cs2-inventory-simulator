/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { SessionStorage } from "@remix-run/server-runtime";
import { AuthenticateOptions, Strategy } from "remix-auth";
import SteamAPI, { UserSummary } from "steamapi";
import { z } from "zod";
import {
  clearAuthTokens,
  clearExpiredAuthTokens,
  getAuthTokenDetails
} from "./models/api-auth-token.server";
import { resolveDomain } from "./models/domain.server";
import { getRule } from "./models/rule.server";
import { upsertUser } from "./models/user.server";
import { fail } from "./utils/misc";

export class ApiStrategy extends Strategy<
  string,
  {
    request: Request;
    userId: string;
  }
> {
  name = "api";

  constructor() {
    super(
      async ({ userId, request }) =>
        await upsertUser(
          await resolveDomain(request),
          (await new SteamAPI(await getRule("steamApiKey")).getUserSummary(
            userId
          )) as UserSummary
        )
    );
  }

  async authenticate(
    request: Request,
    sessionStorage: SessionStorage,
    options: AuthenticateOptions
  ) {
    try {
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

      return this.success(
        await this.verify({ userId, request }),
        request,
        sessionStorage,
        options
      );
    } catch (error) {
      return this.failure(
        (error as Error)?.message ?? "An error occurred.",
        request,
        sessionStorage,
        options,
        new Error(JSON.stringify(error))
      );
    }
  }
}
