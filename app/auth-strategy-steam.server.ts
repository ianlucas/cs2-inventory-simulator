/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { SteamStrategy as SteamStrategyBase } from "@ianlucas/remix-auth-steam";
import { getRule } from "./models/rule.server";
import { upsertUser } from "./models/user.server";

export class SteamStrategy extends SteamStrategyBase<string> {
  constructor() {
    super(
      async () => ({
        returnURL: await getRule("SteamCallbackUrl"),
        apiKey: await getRule("SteamApiKey")
      }),
      async (user) => await upsertUser(user)
    );
  }
}
