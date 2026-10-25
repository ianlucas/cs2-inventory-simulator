/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { expect, test } from "vitest";
import { formatRelativeTime } from "./relative-time";

const NOW = new Date("2026-10-21T12:00:00.000Z").getTime();

test("formatRelativeTime formats past and future times in whole units", () => {
  expect(formatRelativeTime(new Date(NOW - 90 * 60_000), NOW, "en")).toBe(
    "1 hour ago"
  );
  expect(formatRelativeTime(new Date(NOW - 20_000), NOW, "en")).toBe("now");
  expect(
    formatRelativeTime(new Date("2026-10-26T00:00:00.000Z"), NOW, "en")
  ).toBe("in 4 days");
});
