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

const AK47_ASIIMOV_FN = { id: 244, wear: 0.06 };
const AK47_ASIIMOV_URL =
  "/api/action/economy-price?id=244&statTrak=false&exterior=FN";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((settle) => {
    resolve = settle;
  });
  return { promise, resolve };
}

function priceResponse(price: number | null) {
  return new Response(JSON.stringify({ price }));
}

describe("useEconomyPrice", () => {
  let container: HTMLElement;
  let fetchMock: ReturnType<typeof vi.fn<(url: string) => Promise<Response>>>;
  let root: Root | undefined;
  let useEconomyPrice: typeof UseEconomyPrice;

  function EconomyPriceProbe({ item }: { item: CS2InventoryItem }) {
    const { isEnabled, isLoading, price } = useEconomyPrice(item);
    return (
      <div>
        {!isEnabled ? "disabled" : isLoading ? "loading" : String(price)}
      </div>
    );
  }

  function open(count = 1) {
    close();
    root = createRoot(container);
    const item = createFakeInventoryItemFromBase(AK47_ASIIMOV_FN);
    act(() =>
      root?.render(
        Array.from({ length: count }, (_, index) => (
          <EconomyPriceProbe item={item} key={index} />
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
    fetchMock.mockResolvedValue(priceResponse(12.5));
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
    fetchMock.mockResolvedValue(priceResponse(null));
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
    open(2);
    expect(container.textContent).toBe("loadingloading");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    response.resolve(priceResponse(3));
    await flush();
    expect(container.textContent).toBe("33");
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

    fetchMock.mockResolvedValueOnce(priceResponse(7));
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
