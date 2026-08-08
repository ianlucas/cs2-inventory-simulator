/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, CS2ItemWear, CS2_ITEMS } from "@ianlucas/cs2-lib";
import { english } from "@ianlucas/cs2-lib/translations";
import { describe, expect, it } from "vitest";
import {
  getEconomyPriceSourceDate,
  getEconomyPriceSourceUrl,
  mapEconomyPrice
} from "./economy-price-data";

CS2Economy.load({ items: CS2_ITEMS, language: english });

describe("economy prices", () => {
  it("uses the previous UTC day in the source URL", () => {
    const sourceDate = getEconomyPriceSourceDate(
      new Date("2026-08-08T00:30:00.000Z")
    );

    expect(sourceDate.toISOString()).toBe("2026-08-07T00:00:00.000Z");
    expect(getEconomyPriceSourceUrl(sourceDate)).toBe(
      "https://raw.githack.com/LukeX404/cs2-prices-tracker/main/static/prices/date/2026-08-07.json"
    );
  });

  it("maps Steam market modifiers to a cs2-lib economy item", () => {
    expect(
      mapEconomyPrice("StatTrak™ AK-47 | Asiimov (Factory New)", {
        last_24h: 1,
        last_7d: 2,
        last_30d: 3,
        last_90d: 4
      })
    ).toMatchObject({
      economyItemId: 244,
      exterior: CS2ItemWear.FactoryNew,
      statTrak: true,
      souvenir: false
    });
  });

  it("maps known Steam catalog aliases without fuzzy matching", () => {
    const prices = { last_24h: null, last_7d: 2, last_30d: 3, last_90d: 4 };

    expect(mapEconomyPrice("★ Karambit", prices)).toMatchObject({
      economyItemId: 41
    });
    expect(
      mapEconomyPrice("'Blueberries' Buckshot | NSWC SEAL", prices)
    ).toMatchObject({ economyItemId: 8633 });
    expect(mapEconomyPrice("Sealed Graffiti | Ace", prices)).toMatchObject({
      economyItemId: 9543
    });
    expect(mapEconomyPrice("Definitely not an item", prices)).toBeUndefined();
  });
});
