/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, test, vi } from "vitest";
import type { UnlockFeedEvent } from "~/unlock-feed";

vi.mock("~/routes/api.unlock-feed._index", () => ({
  ApiUnlockFeedUrl: "/api/unlock-feed"
}));

import {
  UNLOCK_FEED_MAX_LINES,
  UnlockFeedLine,
  unlockFeedReducer
} from "./use-unlock-feed";

const EVENT: UnlockFeedEvent = {
  itemId: 1347,
  statTrak: false,
  userId: "76561197960265728",
  userName: "Player"
};

function push(lines: UnlockFeedLine[], id: number) {
  return unlockFeedReducer(lines, { type: "push", event: EVENT, id });
}

function pushMany(count: number) {
  let lines: UnlockFeedLine[] = [];
  for (let id = 0; id < count; id++) {
    lines = push(lines, id);
  }
  return lines;
}

function leavingIds(lines: UnlockFeedLine[]) {
  return lines.filter((line) => line.leaving).map((line) => line.id);
}

function fit(lines: UnlockFeedLine[], lineCounts: Record<number, number> = {}) {
  return unlockFeedReducer(lines, {
    type: "fit",
    lineCounts: new Map(
      Object.entries(lineCounts).map(([id, count]) => [Number(id), count])
    )
  });
}

describe("unlockFeedReducer", () => {
  test("appends new lines at the bottom", () => {
    expect(pushMany(3).map((line) => line.id)).toEqual([0, 1, 2]);
    expect(leavingIds(pushMany(3))).toEqual([]);
  });

  test("fit fades out the top line once pushed past the limit", () => {
    const lines = fit(pushMany(UNLOCK_FEED_MAX_LINES + 1));
    expect(lines).toHaveLength(UNLOCK_FEED_MAX_LINES + 1);
    expect(leavingIds(lines)).toEqual([0]);
  });

  test("fit keeps the limit of visible lines during bursts", () => {
    const lines = fit(pushMany(UNLOCK_FEED_MAX_LINES + 3));
    expect(leavingIds(lines)).toEqual([0, 1, 2]);
    expect(lines.filter((line) => !line.leaving)).toHaveLength(
      UNLOCK_FEED_MAX_LINES
    );
  });

  test("fit counts every text line of wrapped messages", () => {
    // 1 + 2 + 2 + 2 = 7 text lines fit; the oldest message would be the 8th.
    const lines = fit(pushMany(5), { 1: 2, 2: 2, 3: 2 });
    expect(leavingIds(lines)).toEqual([0]);
  });

  test("fit drops a wrapped message that only partly fits", () => {
    // 1 + 2 + 2 + 1 = 6, so the 2-line message on top would need lines 7 and 8.
    const lines = fit(pushMany(5), { 0: 2, 2: 2, 3: 2 });
    expect(leavingIds(lines)).toEqual([0]);
  });

  test("fit always keeps the newest message", () => {
    const lines = fit(pushMany(2), { 1: UNLOCK_FEED_MAX_LINES + 1 });
    expect(leavingIds(lines)).toEqual([0]);
  });

  test("fit returns the same state when everything fits", () => {
    const lines = pushMany(3);
    expect(fit(lines)).toBe(lines);
  });

  test("an expired line frees room for the next one", () => {
    let lines = fit(pushMany(UNLOCK_FEED_MAX_LINES));
    lines = unlockFeedReducer(lines, { type: "expire", id: 0 });
    lines = fit(push(lines, UNLOCK_FEED_MAX_LINES));
    expect(leavingIds(lines)).toEqual([0]);
  });

  test("expire fades a line out in place", () => {
    const lines = unlockFeedReducer(pushMany(3), { type: "expire", id: 0 });
    expect(lines.map((line) => line.id)).toEqual([0, 1, 2]);
    expect(leavingIds(lines)).toEqual([0]);
  });

  test("remove drops the line", () => {
    const lines = unlockFeedReducer(pushMany(3), { type: "remove", id: 1 });
    expect(lines.map((line) => line.id)).toEqual([0, 2]);
  });
});
