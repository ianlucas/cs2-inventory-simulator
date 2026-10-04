/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { prisma } from "~/db.server";
import type { CS2ItemExterior } from "~/generated/prisma/enums";
import { pickEconomyPrice } from "~/shared/economy";

export async function findEconomyPrice({
  exterior,
  id,
  statTrak
}: {
  exterior?: CS2ItemExterior;
  id: number;
  statTrak: boolean;
}) {
  const row = await prisma.economyPrice.findFirst({
    orderBy: { sourceDate: "desc" },
    select: {
      avgPrice24h: true,
      avgPrice7d: true,
      avgPrice30d: true,
      avgPrice90d: true
    },
    where: {
      economyItemId: id,
      exterior: exterior ?? null,
      souvenir: false,
      statTrak
    }
  });
  return row !== null ? (pickEconomyPrice(row)?.toNumber() ?? null) : null;
}
