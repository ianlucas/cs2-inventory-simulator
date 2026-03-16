/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { describe, expect, test } from "vitest";
import { RulesPageContent } from "./rules-page-content";
import { serverRulesSections } from "~/data/server-rules";

describe("RulesPageContent", () => {
  test("renders at least one section title and body text", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    flushSync(() => {
      root.render(
        <RulesPageContent sections={serverRulesSections} />
      );
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
