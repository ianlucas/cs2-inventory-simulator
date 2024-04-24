/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { SteamStrategy as BaseSteamStrategy } from "@ianlucas/remix-auth-steam";
import { resolveDomain, resolveUrlDomain } from "./models/domain.server";
import { getRule } from "./models/rule.server";
import { upsertUser } from "./models/user.server";

export class SteamStrategy extends BaseSteamStrategy<string> {
  constructor() {
    super(
      async (request) => {
        return {
          returnURL: await resolveUrlDomain(
            request,
            await getRule("steamCallbackUrl")
          ),
          apiKey: await getRule("steamApiKey")
        };
      },
      async ({ request, user }) =>
        await upsertUser(await resolveDomain(request), user)
    );
  }
}
