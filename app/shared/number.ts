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

export function format(n: number, locale?: string) {
  try {
    return new Intl.NumberFormat(locale).format(n);
  } catch {
    return n.toString();
  }
}

export function formatCompact(n: number, locale?: string) {
  try {
    return new Intl.NumberFormat(locale, { notation: "compact" }).format(n);
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

export function formatSimulatorDollars(
  value: number,
  locale?: string,
  signed = false
) {
  const absolute = Math.abs(value);
  const sign = value < 0 ? "-" : signed && value > 0 ? "+" : "";
  try {
    const formatted = new Intl.NumberFormat(
      locale,
      absolute >= 10_000
        ? { maximumFractionDigits: 1, notation: "compact" }
        : { maximumFractionDigits: 2, minimumFractionDigits: 2 }
    ).format(absolute);
    return `${sign}S$${formatted}`;
  } catch {
    return `${sign}S$${absolute.toFixed(2)}`;
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
