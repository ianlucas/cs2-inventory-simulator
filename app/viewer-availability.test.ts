/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, CS2ItemType, CS2RarityColor } from "@ianlucas/cs2-lib";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ViewerServerStatus } from "~/data/viewer";
import {
  VIEWER_BACKOFF_DELAYS_MS,
  VIEWER_BACKOFF_RESET_MS,
  ViewerClientAvailability,
  viewerClientAvailability
} from "./viewer-availability";

CS2Economy.load({
  items: [
    { id: 5, type: CS2ItemType.Weapon, rarityColor: CS2RarityColor.Common },
    { id: 6, type: CS2ItemType.Weapon, rarityColor: CS2RarityColor.Common },
    { id: 50, type: CS2ItemType.Sticker, rarityColor: CS2RarityColor.Common }
  ]
});

const server: ViewerServerStatus = {
  available: true,
  catalog: { maxId: 100, holes: [[10, 12]] }
};

const weapon = { id: 5, stickers: { 0: { id: 50 } } };

let availability: ViewerClientAvailability;

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  availability = new ViewerClientAvailability();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("ViewerClientAvailability", () => {
  it("follows the server verdict while nothing failed on the page", () => {
    expect(availability.isAvailable(server)).toBe(true);
    expect(
      availability.isAvailable({ available: false, reason: "pending" })
    ).toBe(false);
    expect(availability.getClientState()).toEqual({
      available: true,
      retryable: true
    });
  });

  it("checks items against the server catalog", () => {
    expect(availability.isItemSupported(server, weapon)).toBe(true);
    expect(availability.isIdSupported(server, 11)).toBe(false);
    expect(
      availability.isItemSupported(
        { available: false, reason: "catalog-failed" },
        weapon
      )
    ).toBe(false);
  });

  it("backs off timeouts and network failures on one shared, short schedule", () => {
    const waits: number[] = [];
    for (let index = 0; index < VIEWER_BACKOFF_DELAYS_MS.length + 1; index++) {
      const now = Date.now();
      if (index % 2 === 0) {
        availability.reportTimeout();
      } else {
        availability.reportUnsupported(undefined, "network");
      }
      const { retryAt } = availability.getClientState();
      waits.push((retryAt ?? now) - now);
      vi.advanceTimersByTime(waits[index]);
    }
    expect(waits).toEqual([
      ...VIEWER_BACKOFF_DELAYS_MS,
      VIEWER_BACKOFF_DELAYS_MS[VIEWER_BACKOFF_DELAYS_MS.length - 1]
    ]);
  });

  it("retries the first timeout on the next view but keeps its reason", () => {
    availability.reportTimeout();
    expect(availability.getClientState()).toEqual({
      available: true,
      reason: "timeout",
      retryable: true,
      retryAt: Date.now()
    });
  });

  it("resets the backoff streak after a quiet period", () => {
    availability.reportTimeout();
    availability.reportTimeout();
    vi.advanceTimersByTime(
      VIEWER_BACKOFF_DELAYS_MS[1] + VIEWER_BACKOFF_RESET_MS
    );
    availability.reportTimeout();
    expect(availability.getClientState().retryAt).toBe(Date.now());
  });

  it("holds a rate limit until retryAt and notifies when it clears", () => {
    const listener = vi.fn();
    availability.subscribe(listener);
    availability.reportRateLimited(30_000);
    expect(availability.isAvailable(server)).toBe(false);
    expect(availability.getClientState()).toMatchObject({
      reason: "rate-limited",
      retryAt: Date.now() + 30_000
    });
    expect(listener).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(30_000);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(availability.isAvailable(server)).toBe(true);
  });

  it("never shortens an active failure", () => {
    availability.reportRateLimited(30_000);
    availability.reportTimeout();
    expect(availability.getClientState()).toMatchObject({
      reason: "rate-limited",
      retryAt: Date.now() + 30_000
    });
  });

  it("keeps WebGL failures until reload", () => {
    availability.reportUnsupported(undefined, "webgl");
    availability.reportRateLimited(1_000);
    vi.advanceTimersByTime(60 * 60_000);
    expect(availability.getClientState()).toEqual({
      available: false,
      reason: "webgl",
      retryable: false,
      retryAt: undefined
    });
  });

  it("blocks only the item the viewer couldn't render, across edits", () => {
    availability.reportUnsupported({ ...weapon, seed: 1 }, "sticker");
    expect(availability.isAvailable(server)).toBe(true);
    expect(availability.isItemSupported(server, { ...weapon, wear: 0.5 })).toBe(
      false
    );
    expect(availability.isItemSupported(server, { id: 5 })).toBe(true);
    expect(availability.isItemSupported(server, { id: 6 })).toBe(true);
    expect(availability.getStatus().items).toEqual([
      { key: "5,50", reason: "sticker", at: Date.now() }
    ]);
  });

  it("reports server, client and item state with the catalog summarised", () => {
    availability.setServerStatus(server);
    availability.reportRateLimited(1_000);
    expect(availability.getStatus()).toEqual({
      server: { available: true, catalog: { maxId: 100, holes: 1 } },
      client: {
        available: false,
        reason: "rate-limited",
        retryable: true,
        retryAt: Date.now() + 1_000
      },
      items: []
    });
  });

  it("exposes the page instance on window.InventorySimulator", () => {
    expect(window.InventorySimulator.getViewerStatus?.()).toEqual(
      viewerClientAvailability.getStatus()
    );
  });
});
