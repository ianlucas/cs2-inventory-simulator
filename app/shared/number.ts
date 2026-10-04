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

export function format(n: number) {
  try {
    return new Intl.NumberFormat().format(n);
  } catch {
    return n.toString();
  }
}

export function formatUsd(n: number) {
  try {
    return new Intl.NumberFormat(undefined, {
      currency: "USD",
      style: "currency"
    }).format(n);
  } catch {
    return n.toString();
  }
}

export function resolveLimit(value: number, hardMax: number) {
  return value < 0 ? hardMax : Math.min(value, hardMax);
}

export function isCountAllowed({
  current,
  max,
  next
}: {
  current: number;
  max: number;
  next: number;
}) {
  return next <= Math.max(max, current);
}
