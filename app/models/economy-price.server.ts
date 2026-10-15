/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { prisma } from "~/db.server";
import { EconomyListingPrice } from "~/shared/economy";

/**
 * Finds the item's listings. A StatTrak item without StatTrak listings, e.g.
 * one that can't be StatTrak in game, is approximated by its regular listings.
 */
export async function findEconomyPrices({
  id,
  statTrak
}: {
  id: number;
  statTrak: boolean;
}): Promise<EconomyListingPrice[]> {
  const rows = await prisma.economyPrice.findMany({
    select: { approximate: true, exterior: true, price: true, statTrak: true },
    where: { economyItemId: id }
  });
  const matching = rows.filter((row) => row.statTrak === statTrak);
  if (statTrak && matching.length === 0) {
    return rows.map(({ exterior, price }) => ({
      approximate: true,
      exterior,
      price: price.toNumber()
    }));
  }
  return matching.map(({ approximate, exterior, price }) => ({
    approximate,
    exterior,
    price: price.toNumber()
  }));
}
