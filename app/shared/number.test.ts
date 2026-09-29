/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { expect, test } from "vitest";
import { isCountAllowed, resolveLimit } from "./number";

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
