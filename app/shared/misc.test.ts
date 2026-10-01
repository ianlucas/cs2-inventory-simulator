/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, test } from "vitest";
import { colorText } from "./misc";

describe("colorText", () => {
  test("leaves plain text untouched", () => {
    expect(colorText("Hello, world.")).toBe("Hello, world.");
  });

  test("wraps text after a color tag in a colored span", () => {
    expect(colorText("{red}Not found.")).toBe(
      '<span style="color: red;">Not found.</span>'
    );
  });

  test("colors each tagged segment separately", () => {
    expect(colorText("plain {green}ok {gray}muted")).toBe(
      'plain <span style="color: green;">ok </span><span style="color: gray;">muted</span>'
    );
  });

  test("escapes HTML so it renders literally", () => {
    expect(colorText("iam <name>")).toBe("iam &lt;name&gt;");
    expect(colorText(`<img src="x" onerror='alert(1)'> & more`)).toBe(
      "&lt;img src=&quot;x&quot; onerror=&#39;alert(1)&#39;&gt; &amp; more"
    );
  });

  test("escapes HTML inside colored segments", () => {
    expect(colorText("{red}Usage: iam <name>")).toBe(
      '<span style="color: red;">Usage: iam &lt;name&gt;</span>'
    );
  });
});
