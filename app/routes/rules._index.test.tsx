/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { describe, expect, test } from "vitest";
import { serverRulesSections } from "~/data/server-rules";
import Rules from "./rules._index";

describe("Rules page", () => {
  test("server rules sections have at least one section with title and body", () => {
    expect(serverRulesSections.length).toBeGreaterThanOrEqual(1);
    const first = serverRulesSections[0];
    expect(first).toHaveProperty("id");
    expect(first).toHaveProperty("title");
    expect(first).toHaveProperty("body");
    expect(first.title.length).toBeGreaterThan(0);
    expect(first.body.length).toBeGreaterThan(0);
  });

  test("Rules page renders at least one section title and body text", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    flushSync(() => {
      root.render(<Rules />);
    });
    const html = container.innerHTML;
    const hasSectionTitle = serverRulesSections.some((s) =>
      html.includes(s.title)
    );
    const hasSectionBody = serverRulesSections.some((s) =>
      html.includes(s.body)
    );
    root.unmount();
    document.body.removeChild(container);
    expect(hasSectionTitle).toBe(true);
    expect(hasSectionBody).toBe(true);
  });
});
