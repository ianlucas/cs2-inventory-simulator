/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, test } from "vitest";
import { serverRulesSections } from "./server-rules";

describe("server-rules", () => {
  test("sections have at least one section with id, title and body", () => {
    expect(serverRulesSections.length).toBeGreaterThanOrEqual(1);
    const first = serverRulesSections[0];
    expect(first).toHaveProperty("id");
    expect(first).toHaveProperty("title");
    expect(first).toHaveProperty("body");
    expect(first.title.length).toBeGreaterThan(0);
    expect(first.body.length).toBeGreaterThan(0);
  });
});
