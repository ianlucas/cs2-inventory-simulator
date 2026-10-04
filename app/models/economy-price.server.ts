/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { prisma } from "~/db.server";
import type { CS2ItemExterior } from "~/generated/prisma/enums";
import { EconomyListingPrice, pickEconomyPrice } from "~/shared/economy";

export async function findEconomyPrices({
  id,
  statTrak
}: {
  id: number;
  statTrak: boolean;
}) {
  const rows = await prisma.economyPrice.findMany({
    orderBy: { sourceDate: "desc" },
    select: {
      avgPrice24h: true,
      avgPrice7d: true,
      avgPrice30d: true,
      avgPrice90d: true,
      exterior: true
    },
    where: { economyItemId: id, souvenir: false, statTrak }
  });
  const seen = new Set<CS2ItemExterior | null>();
  const listings: EconomyListingPrice[] = [];
  for (const row of rows) {
    // Rows are newest first, so only each exterior's latest listing counts.
    if (seen.has(row.exterior)) {
      continue;
    }
    seen.add(row.exterior);
    const price = pickEconomyPrice(row);
    if (price !== null) {
      listings.push({ exterior: row.exterior, price: price.toNumber() });
    }
  }
  return listings;
}
