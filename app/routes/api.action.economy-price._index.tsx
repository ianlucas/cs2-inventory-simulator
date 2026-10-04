/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { z } from "zod";
import { api } from "~/api.server";
import { getUserIdFromRequest } from "~/auth.server";
import { CS2ItemExterior } from "~/generated/prisma/enums";
import { middleware } from "~/middleware.server";
import { findEconomyPrice } from "~/models/economy-price.server";
import { unauthorized } from "~/responses.server";
import type { Route } from "./+types/api.action.economy-price._index";

export const ApiActionEconomyPriceUrl = "/api/action/economy-price";

export const loader = api(async ({ request }: Route.LoaderArgs) => {
  await middleware(request);
  const userId = await getUserIdFromRequest(request);
  if (userId === undefined) {
    throw unauthorized;
  }
  const query = z
    .object({
      exterior: z.enum(CS2ItemExterior).optional(),
      id: z.coerce.number().int().nonnegative(),
      statTrak: z
        .enum(["true", "false"])
        .transform((statTrak) => statTrak === "true")
    })
    .parse(Object.fromEntries(new URL(request.url).searchParams));
  return Response.json(
    { price: await findEconomyPrice(query) },
    // Private as it requires auth, shared caches would serve it to anyone.
    { headers: { "Cache-Control": "private, max-age=86400" } }
  );
});
