/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { afterEach, expect, test, vi } from "vitest";

afterEach(() => {
  vi.useRealTimers();
});

test("importing sync leaves no timer behind until it is started", async () => {
  vi.useFakeTimers();
  const { startSync } = await import("./sync");
  expect(vi.getTimerCount()).toBe(0);
  startSync();
  expect(vi.getTimerCount()).toBe(1);
  vi.clearAllTimers();
});
