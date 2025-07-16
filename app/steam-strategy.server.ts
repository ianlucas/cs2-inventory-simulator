/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { SteamStrategy as BaseSteamStrategy } from "@ianlucas/remix-auth-steam";
import SteamAPI, { type UserSummary } from "steamapi";
import { steamApiKey, steamCallbackUrl } from "./models/rule.server";
import { upsertUser } from "./models/user.server";

export class SteamStrategy extends BaseSteamStrategy<string> {
  constructor() {
    super(
      async () => ({
        returnURL: await steamCallbackUrl.get()
      }),
      async ({ userID }) =>
        await upsertUser(
          (await new SteamAPI(await steamApiKey.get()).getUserSummary(
            userID
          )) as UserSummary
        )
    );
  }
}
