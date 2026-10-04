/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2InventoryItem } from "@ianlucas/cs2-lib";
import { useEffect, useState } from "react";
import { ApiActionEconomyPriceUrl } from "~/routes/api.action.economy-price._index";
import {
  EconomyListingPrice,
  EconomyPriceQuery,
  getEconomyPriceQuery,
  selectEconomyPrice
} from "~/shared/economy";
import { usePreferences, useUser } from "../app-context";

// Keyed by request URL. Prices come from a static snapshot, so they're kept for
// the page's lifetime.
const listingsByUrl = new Map<string, EconomyListingPrice[]>();
const requests = new Map<string, Promise<EconomyListingPrice[]>>();

function getEconomyPriceUrl({ id, statTrak }: EconomyPriceQuery) {
  const params = new URLSearchParams({
    id: String(id),
    statTrak: String(statTrak)
  });
  return `${ApiActionEconomyPriceUrl}?${params}`;
}

// Failures resolve to no listings without being cached, so the next tooltip
// retries.
function requestEconomyPrices(url: string) {
  let request = requests.get(url);
  if (request === undefined) {
    request = fetch(url)
      .then(async (response) => {
        if (!response.ok) {
          return [];
        }
        const { prices } = (await response.json()) as {
          prices: EconomyListingPrice[];
        };
        listingsByUrl.set(url, prices);
        return prices;
      })
      .catch(() => [])
      .finally(() => requests.delete(url));
    requests.set(url, request);
  }
  return request;
}

export function useEconomyPrice(item: CS2InventoryItem) {
  const user = useUser();
  const { statsForNerds } = usePreferences();
  const isEnabled = statsForNerds && user !== undefined;
  const url = getEconomyPriceUrl(getEconomyPriceQuery(item));
  const [settled, setSettled] = useState<{
    listings: EconomyListingPrice[];
    url: string;
  }>();

  useEffect(() => {
    if (!isEnabled || listingsByUrl.has(url)) {
      return;
    }
    let isActive = true;
    void requestEconomyPrices(url).then((listings) => {
      if (isActive) {
        setSettled({ listings, url });
      }
    });
    return () => {
      isActive = false;
    };
  }, [isEnabled, url]);

  const listings =
    listingsByUrl.get(url) ??
    (settled?.url === url ? settled.listings : undefined);
  if (listings === undefined) {
    return { isApproximate: false, isEnabled, isLoading: true, price: null };
  }
  return {
    ...selectEconomyPrice(listings, item),
    isEnabled,
    isLoading: false
  };
}
