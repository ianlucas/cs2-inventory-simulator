/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export function range(n: number, count: number = 0) {
  const items = [];
  for (let i = 0; i < n; i += 1) {
    items.push(count);
    count += 1;
  }
  return items;
}

export function size<T>(arr: T[] | undefined) {
  return arr?.length ?? 0;
}
