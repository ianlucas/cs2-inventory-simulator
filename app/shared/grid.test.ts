/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { expect, test } from "vitest";
import { getGridColumns, getGridRow, getGridRowCount } from "./grid";

const tiles = { gap: 16, minColumnWidth: 154 };

test("getGridColumns fits as many columns as auto-fit does", () => {
  expect(getGridColumns({ ...tiles, width: 1024 })).toBe(6);
  expect(getGridColumns({ ...tiles, width: 752 })).toBe(4);
  expect(getGridColumns({ ...tiles, width: 344 })).toBe(2);
});

test("getGridColumns counts the gap only between columns", () => {
  expect(getGridColumns({ ...tiles, width: 154 * 2 + 16 })).toBe(2);
  expect(getGridColumns({ ...tiles, width: 154 * 2 + 16 - 1 })).toBe(1);
});

test("getGridColumns keeps one column however narrow the grid is", () => {
  expect(getGridColumns({ ...tiles, width: 100 })).toBe(1);
  expect(getGridColumns({ ...tiles, width: 0 })).toBe(1);
});

test("getGridRowCount counts a partial last row", () => {
  expect(getGridRowCount(0, 6)).toBe(0);
  expect(getGridRowCount(6, 6)).toBe(1);
  expect(getGridRowCount(7, 6)).toBe(2);
});

test("getGridRow takes the items of one row, short on the last", () => {
  const items = [1, 2, 3, 4, 5, 6, 7];
  expect(getGridRow(items, 3, 0)).toEqual([1, 2, 3]);
  expect(getGridRow(items, 3, 1)).toEqual([4, 5, 6]);
  expect(getGridRow(items, 3, 2)).toEqual([7]);
});
