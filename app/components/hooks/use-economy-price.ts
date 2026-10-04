/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2InventoryItem } from "@ianlucas/cs2-lib";
import { useEffect, useState } from "react";
import { ApiActionEconomyPriceUrl } from "~/routes/api.action.economy-price._index";
import { EconomyPriceQuery, getEconomyPriceQuery } from "~/shared/economy";
import { usePreferences, useUser } from "../app-context";

type EconomyPrice = number | null;

// Keyed by request URL. Prices come from a static snapshot, so they're kept for
// the page's lifetime.
const prices = new Map<string, EconomyPrice>();
const requests = new Map<string, Promise<EconomyPrice>>();

function getEconomyPriceUrl({ exterior, id, statTrak }: EconomyPriceQuery) {
  const params = new URLSearchParams({
    id: String(id),
    statTrak: String(statTrak)
  });
  if (exterior !== undefined) {
    params.set("exterior", exterior);
  }
  return `${ApiActionEconomyPriceUrl}?${params}`;
}

// Failures resolve to null without being cached, so the next tooltip retries.
function requestEconomyPrice(url: string) {
  let request = requests.get(url);
  if (request === undefined) {
    request = fetch(url)
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }
        const { price } = (await response.json()) as { price: EconomyPrice };
        prices.set(url, price);
        return price;
      })
      .catch(() => null)
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
    price: EconomyPrice;
    url: string;
  }>();

  useEffect(() => {
    if (!isEnabled || prices.has(url)) {
      return;
    }
    let isActive = true;
    void requestEconomyPrice(url).then((price) => {
      if (isActive) {
        setSettled({ price, url });
      }
    });
    return () => {
      isActive = false;
    };
  }, [isEnabled, url]);

  const price = prices.has(url)
    ? prices.get(url)
    : settled?.url === url
      ? settled.price
      : undefined;
  return { isEnabled, isLoading: price === undefined, price: price ?? null };
}
