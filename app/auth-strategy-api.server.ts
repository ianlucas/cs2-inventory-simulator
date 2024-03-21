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
import { getRule } from "./models/rule.server";
import { upsertUser } from "./models/user.server";
import { fail } from "./utils/misc";

export class ApiStrategy extends Strategy<string, string> {
  name = "api";

  constructor() {
    super(
      async (userId: string) =>
        await upsertUser(
          (await new SteamAPI(await getRule("SteamApiKey")).getUserSummary(
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
      return await this.success(
        await this.verify(userId),
        request,
        sessionStorage,
        options
      );
    } catch (error) {
      if (error instanceof Response) {
        throw error;
      }
      if (error instanceof Error) {
        return await this.failure(
          error.message,
          request,
          sessionStorage,
          options,
          error
        );
      }
      return await this.failure(
        "unknown error",
        request,
        sessionStorage,
        options,
        new Error(JSON.stringify(error))
      );
    }
  }
}
