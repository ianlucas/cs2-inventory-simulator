/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { expect, test } from "vitest";
import { parseGameMarkup } from "./game-markup";

test("parseGameMarkup keeps plain text as is", () => {
  expect(parseGameMarkup("Hello")).toEqual(["Hello"]);
});

test("parseGameMarkup parses line breaks, italics and font colors", () => {
  expect(
    parseGameMarkup(
      '• Cheap<br><i>• Difficulty: <font color="#BF9240">★★★</font></i>'
    )
  ).toEqual([
    "• Cheap",
    { tag: "br" },
    {
      tag: "i",
      color: undefined,
      children: [
        "• Difficulty: ",
        { tag: "font", color: "#BF9240", children: ["★★★"] }
      ]
    }
  ]);
});

test("parseGameMarkup tolerates stray characters in attributes", () => {
  expect(parseGameMarkup('<font color="#40BF40"`>★</font>')).toEqual([
    { tag: "font", color: "#40BF40", children: ["★"] }
  ]);
});

test("parseGameMarkup ignores unknown tags and unmatched closings", () => {
  expect(parseGameMarkup("<script>x</script></i>y")).toEqual([
    "<script>x</script>",
    "y"
  ]);
});
