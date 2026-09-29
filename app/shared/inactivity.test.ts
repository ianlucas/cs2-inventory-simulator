/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { expect, test } from "vitest";
import { DAY_IN_MS, isInactive } from "./inactivity";

const now = 1_000 * DAY_IN_MS;

test("isInactive is disabled when days is zero or negative", () => {
  expect(isInactive(new Date(0), 0, now)).toBe(false);
  expect(isInactive(new Date(0), -5, now)).toBe(false);
});

test("isInactive is true when lastSeen is older than the threshold", () => {
  expect(isInactive(new Date(now - 31 * DAY_IN_MS), 30, now)).toBe(true);
});

test("isInactive is false when lastSeen is within the threshold", () => {
  expect(isInactive(new Date(now - 29 * DAY_IN_MS), 30, now)).toBe(false);
});

test("isInactive is false at exactly the threshold", () => {
  expect(isInactive(new Date(now - 30 * DAY_IN_MS), 30, now)).toBe(false);
});
