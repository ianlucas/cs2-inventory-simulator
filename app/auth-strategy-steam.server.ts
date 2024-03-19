/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { SteamStrategy as SteamStrategyBase } from "@ianlucas/remix-auth-steam";
import { STEAM_API_KEY, STEAM_CALLBACK_URL } from "./env.server";
import { upsertUser } from "./models/user.server";

export class SteamStrategy extends SteamStrategyBase<string> {
  constructor() {
    super(
      async () => ({
        returnURL: STEAM_CALLBACK_URL,
        apiKey: STEAM_API_KEY
      }),
      async (user) => await upsertUser(user)
    );
  }
}
