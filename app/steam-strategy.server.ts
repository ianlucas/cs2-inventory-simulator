/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { SteamStrategy as BaseSteamStrategy } from "@ianlucas/remix-auth-steam";
import { isValidDomain } from "./models/domain.server";
import { getRule } from "./models/rule.server";
import { upsertUser } from "./models/user.server";

export class SteamStrategy extends BaseSteamStrategy<string> {
  constructor() {
    super(
      async (request) => {
        const requestUrl = new URL(request.url);
        const returnUrl = new URL(await getRule("steamCallbackUrl"));
        if (await isValidDomain(requestUrl.hostname)) {
          returnUrl.hostname = requestUrl.hostname;
        }
        return {
          returnURL: returnUrl.toString(),
          apiKey: await getRule("steamApiKey")
        };
      },
      async ({ user }) => await upsertUser(user)
    );
  }
}
