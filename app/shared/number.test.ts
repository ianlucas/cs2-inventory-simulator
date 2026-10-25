/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { expect, test } from "vitest";
import {
  formatCompact,
  formatSimulatorDollars,
  isCountAllowed,
  resolveLimit
} from "./number";

test("resolveLimit uses the hard max for negative values", () => {
  expect(resolveLimit(-1, 5)).toBe(5);
  expect(resolveLimit(-99, 5)).toBe(5);
});

test("resolveLimit clamps values above the hard max", () => {
  expect(resolveLimit(99, 5)).toBe(5);
  expect(resolveLimit(5, 5)).toBe(5);
});

test("resolveLimit keeps values within range", () => {
  expect(resolveLimit(0, 5)).toBe(0);
  expect(resolveLimit(1, 5)).toBe(1);
  expect(resolveLimit(4, 5)).toBe(4);
});

test("isCountAllowed allows counts up to the max", () => {
  expect(isCountAllowed({ next: 0, current: 0, max: 1 })).toBe(true);
  expect(isCountAllowed({ next: 1, current: 0, max: 1 })).toBe(true);
  expect(isCountAllowed({ next: 5, current: 0, max: 5 })).toBe(true);
});

test("isCountAllowed blocks counts above the max", () => {
  expect(isCountAllowed({ next: 2, current: 0, max: 1 })).toBe(false);
  expect(isCountAllowed({ next: 1, current: 0, max: 0 })).toBe(false);
});

test("isCountAllowed allows counts already over the max to stay", () => {
  expect(isCountAllowed({ next: 5, current: 5, max: 1 })).toBe(true);
});

test("isCountAllowed allows counts already over the max to shrink", () => {
  expect(isCountAllowed({ next: 4, current: 5, max: 1 })).toBe(true);
  expect(isCountAllowed({ next: 1, current: 5, max: 1 })).toBe(true);
  expect(isCountAllowed({ next: 0, current: 5, max: 1 })).toBe(true);
});

test("isCountAllowed blocks counts already over the max from growing", () => {
  expect(isCountAllowed({ next: 6, current: 5, max: 1 })).toBe(false);
});

test("formatSimulatorDollars shows cents for small values and compacts large ones", () => {
  expect(formatSimulatorDollars(13.876, "en")).toBe("S$13.88");
  expect(formatSimulatorDollars(781_250, "en")).toBe("S$781.3K");
  expect(formatSimulatorDollars(-412.5, "en", true)).toBe("-S$412.50");
  expect(formatSimulatorDollars(412_000, "en", true)).toBe("+S$412K");
});

test("formatCompact keeps small numbers and shortens large ones", () => {
  expect(formatCompact(999, "en")).toBe("999");
  expect(formatCompact(1_234, "en")).toBe("1.2K");
  expect(formatCompact(12_344, "en")).toBe("12K");
});
