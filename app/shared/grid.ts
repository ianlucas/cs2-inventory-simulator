/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export function getGridColumns({
  gap,
  minColumnWidth,
  width
}: {
  gap: number;
  minColumnWidth: number;
  width: number;
}) {
  return Math.max(1, Math.floor((width + gap) / (minColumnWidth + gap)));
}

export function getGridRowCount(itemCount: number, columns: number) {
  return Math.ceil(itemCount / columns);
}

export function getGridRow<T>(items: T[], columns: number, row: number) {
  return items.slice(row * columns, (row + 1) * columns);
}
