/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const RELATIVE_TIME_UNITS = [
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60]
] as const;

export function formatRelativeTime(date: Date, now: number, locale: string) {
  const seconds = (date.getTime() - now) / 1_000;
  try {
    const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    for (const [unit, unitSeconds] of RELATIVE_TIME_UNITS) {
      if (Math.abs(seconds) >= unitSeconds) {
        return formatter.format(Math.trunc(seconds / unitSeconds), unit);
      }
    }
    return formatter.format(0, "second");
  } catch {
    return date.toISOString();
  }
}
