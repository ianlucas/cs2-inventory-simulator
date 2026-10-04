/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, CS2InventoryItem, CS2_ITEMS } from "@ianlucas/cs2-lib";
import { english } from "@ianlucas/cs2-lib/translations/english";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeInventoryItemFromBase } from "~/shared/inventory";
import type { useEconomyPrice as UseEconomyPrice } from "./use-economy-price";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

CS2Economy.load({
  items: CS2_ITEMS,
  language: english
});

const context = vi.hoisted(() => ({
  statsForNerds: true,
  user: { id: "76561197960287930" } as object | undefined
}));

vi.mock("~/components/app-context", () => ({
  usePreferences: () => ({ statsForNerds: context.statsForNerds }),
  useUser: () => context.user
}));

vi.mock("~/routes/api.action.economy-price._index", () => ({
  ApiActionEconomyPriceUrl: "/api/action/economy-price"
}));

const AK47_ASIIMOV_ID = 244;
const AK47_ASIIMOV_URL = "/api/action/economy-price?id=244&statTrak=false";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((settle) => {
    resolve = settle;
  });
  return { promise, resolve };
}

function pricesResponse(prices: Record<string, number> = {}) {
  return new Response(
    JSON.stringify({
      prices: Object.entries(prices).map(([exterior, price]) => ({
        exterior,
        price
      }))
    })
  );
}

describe("useEconomyPrice", () => {
  let container: HTMLElement;
  let fetchMock: ReturnType<typeof vi.fn<(url: string) => Promise<Response>>>;
  let root: Root | undefined;
  let useEconomyPrice: typeof UseEconomyPrice;

  function EconomyPriceProbe({ item }: { item: CS2InventoryItem }) {
    const { isApproximate, isEnabled, isLoading, price } =
      useEconomyPrice(item);
    return (
      <div>
        {!isEnabled
          ? "disabled"
          : isLoading
            ? "loading"
            : `${isApproximate ? "≈" : ""}${price}`}
      </div>
    );
  }

  function open(...wears: number[]) {
    close();
    root = createRoot(container);
    act(() =>
      root?.render(
        (wears.length > 0 ? wears : [0.06]).map((wear, index) => (
          <EconomyPriceProbe
            item={createFakeInventoryItemFromBase({
              id: AK47_ASIIMOV_ID,
              wear
            })}
            key={index}
          />
        ))
      )
    );
  }

  function close() {
    act(() => root?.unmount());
    root = undefined;
  }

  async function flush() {
    await act(async () => {});
  }

  beforeEach(async () => {
    context.statsForNerds = true;
    context.user = { id: "76561197960287930" };
    fetchMock = vi.fn<(url: string) => Promise<Response>>();
    vi.stubGlobal("fetch", fetchMock);
    // The price cache is module state, so each test starts from a fresh one.
    vi.resetModules();
    ({ useEconomyPrice } = await import("./use-economy-price"));
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    close();
    container.remove();
    vi.unstubAllGlobals();
  });

  it("shows a skeleton until the price arrives, then serves it from cache", async () => {
    fetchMock.mockResolvedValue(pricesResponse({ FN: 12.5 }));
    open();
    expect(container.textContent).toBe("loading");
    expect(fetchMock).toHaveBeenCalledWith(AK47_ASIIMOV_URL);

    await flush();
    expect(container.textContent).toBe("12.5");

    open();
    expect(container.textContent).toBe("12.5");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("caches an item without a price", async () => {
    fetchMock.mockResolvedValue(pricesResponse());
    open();
    await flush();
    expect(container.textContent).toBe("null");

    open();
    expect(container.textContent).toBe("null");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shares one request between tooltips open at once", async () => {
    const response = deferred<Response>();
    fetchMock.mockReturnValue(response.promise);
    open(0.06, 0.06);
    expect(container.textContent).toBe("loadingloading");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    response.resolve(pricesResponse({ FN: 3 }));
    await flush();
    expect(container.textContent).toBe("33");
  });

  it("prices every wear from one request, approximating a missing exterior", async () => {
    fetchMock.mockResolvedValue(pricesResponse({ FN: 10, FT: 3 }));
    open(0.06);
    await flush();
    expect(container.textContent).toBe("10");

    open(0.08, 0.2);
    expect(container.textContent).toBe("≈103");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows no price after a failure and retries on the next open", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
    open();
    await flush();
    expect(container.textContent).toBe("null");

    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    open();
    expect(container.textContent).toBe("loading");
    await flush();
    expect(container.textContent).toBe("null");

    fetchMock.mockResolvedValueOnce(pricesResponse({ FN: 7 }));
    open();
    await flush();
    expect(container.textContent).toBe("7");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("sends no request for guests", () => {
    context.user = undefined;
    open();
    expect(container.textContent).toBe("disabled");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends no request without stats for nerds", () => {
    context.statsForNerds = false;
    open();
    expect(container.textContent).toBe("disabled");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
