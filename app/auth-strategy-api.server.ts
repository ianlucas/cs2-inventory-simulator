/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { SessionStorage } from "@remix-run/server-runtime";
import { AuthenticateOptions, Strategy } from "remix-auth";
import { z } from "zod";
import {
  clearAuthTokens,
  clearExpiredAuthTokens,
  getAuthTokenDetails
} from "./models/api-auth-token.server";
import SteamAPI from "steamapi";
import { STEAM_API_KEY } from "./env.server";
import { upsertUser } from "./models/user.server";

export class ApiStrategy extends Strategy<string, string> {
  name = "api";

  constructor() {
    super(
      async (userId: string) =>
        await upsertUser(
          await new SteamAPI(STEAM_API_KEY).getUserSummary(userId)
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
        throw new Error("invalid token");
      }

      if (!valid) {
        await clearExpiredAuthTokens(userId);
        throw new Error("expired token");
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
