/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2UnlockedItem } from "@ianlucas/cs2-lib";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("~/singleton.server", () => ({
  singleton: (_name: string, factory: () => unknown) => factory()
}));

const state = vi.hoisted(() => ({
  allowProfile: true,
  rateLimited: false,
  showUnlockFeed: true
}));
vi.mock("~/models/rule.server", () => ({
  appShowUnlockFeed: {
    for: () => ({ get: async () => state.showUnlockFeed })
  },
  inventoryAllowProfile: {
    for: () => ({ get: async () => state.allowProfile })
  }
}));
vi.mock("~/models/rate-limit.server", () => ({
  UNLOCK_FEED_RATE_LIMIT: {},
  consumeRateLimitToken: vi.fn(async () => !state.rateLimited)
}));
vi.mock("~/shared/monitoring", () => ({ logError: vi.fn() }));

import { consumeRateLimitToken } from "~/models/rate-limit.server";
import {
  announceUnlockedItem,
  UNLOCK_FEED_PUBLISH_DELAY_MS,
  unlockFeed
} from "./unlock-feed.server";

const USER = { id: "76561197960265728", name: "Player" };

function unlockedItem(
  rarity: CS2UnlockedItem["rarity"],
  statTrak?: number
): CS2UnlockedItem {
  return {
    attributes: {
      containerId: 1,
      seed: undefined,
      statTrak,
      wear: undefined
    },
    id: 1347,
    rarity,
    special: false
  };
}

async function announce(item: CS2UnlockedItem) {
  const listener = vi.fn();
  const unsubscribe = unlockFeed.subscribe(listener);
  await announceUnlockedItem(USER, item);
  vi.advanceTimersByTime(UNLOCK_FEED_PUBLISH_DELAY_MS);
  unsubscribe();
  return listener;
}

describe("announceUnlockedItem", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    state.allowProfile = true;
    state.rateLimited = false;
    state.showUnlockFeed = true;
    vi.mocked(consumeRateLimitToken).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("publishes ancient drops after the wheel delay", async () => {
    const listener = vi.fn();
    const unsubscribe = unlockFeed.subscribe(listener);
    await announceUnlockedItem(USER, unlockedItem("ancient", 0));
    vi.advanceTimersByTime(UNLOCK_FEED_PUBLISH_DELAY_MS - 1);
    expect(listener).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(listener).toHaveBeenCalledWith({
      itemId: 1347,
      statTrak: true,
      userId: USER.id,
      userName: USER.name
    });
    unsubscribe();
  });

  test("ignores drops below ancient without using a token", async () => {
    expect(await announce(unlockedItem("legendary"))).not.toHaveBeenCalled();
    expect(consumeRateLimitToken).not.toHaveBeenCalled();
  });

  test("ignores users with the feed rule off", async () => {
    state.showUnlockFeed = false;
    expect(await announce(unlockedItem("ancient"))).not.toHaveBeenCalled();
  });

  test("ignores users with their profile disabled", async () => {
    state.allowProfile = false;
    expect(await announce(unlockedItem("ancient"))).not.toHaveBeenCalled();
  });

  test("ignores rate-limited users", async () => {
    state.rateLimited = true;
    expect(await announce(unlockedItem("ancient"))).not.toHaveBeenCalled();
  });

  test("stops delivering after unsubscribing", async () => {
    const listener = vi.fn();
    unlockFeed.subscribe(listener)();
    await announceUnlockedItem(USER, unlockedItem("ancient"));
    vi.advanceTimersByTime(UNLOCK_FEED_PUBLISH_DELAY_MS);
    expect(listener).not.toHaveBeenCalled();
  });
});
