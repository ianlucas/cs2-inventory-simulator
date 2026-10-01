/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { beforeEach, describe, expect, test } from "vitest";
import { ConVar, formatHelp } from "./console";

beforeEach(() => {
  window.localStorage.clear();
});

describe("ConVar", () => {
  test("returns default value when unset", () => {
    const convar = new ConVar("test_default", "5", "Test.");
    expect(convar.value).toBe("5");
  });

  test("persists and reads back assigned value", () => {
    const convar = new ConVar("test_assign", "0", "Test.");
    convar.value = "10";
    expect(convar.value).toBe("10");
    expect(new ConVar("test_assign", "0", "Test.").value).toBe("10");
  });

  test("does not clobber other convars in storage", () => {
    const first = new ConVar("test_first", "0", "Test.");
    const second = new ConVar("test_second", "0", "Test.");
    first.value = "1";
    second.value = "2";
    expect(first.value).toBe("1");
    expect(second.value).toBe("2");
  });

  test("falls back to default on corrupted storage", () => {
    window.localStorage.setItem("convars", "not json");
    const convar = new ConVar("test_corrupted", "3", "Test.");
    expect(convar.value).toBe("3");
  });

  test("toBoolean coerces values", () => {
    const convar = new ConVar("test_boolean", "0", "Test.");
    expect(convar.toBoolean()).toBe(false);
    convar.value = "1";
    expect(convar.toBoolean()).toBe(true);
    convar.value = "2";
    expect(convar.toBoolean()).toBe(true);
    convar.value = "0";
    expect(convar.toBoolean()).toBe(false);
    convar.value = "";
    expect(convar.toBoolean()).toBe(false);
    convar.value = "banana";
    expect(convar.toBoolean()).toBe(false);
  });
});

describe("formatHelp", () => {
  test("lists commands and convars in aligned sections", () => {
    expect(
      formatHelp(
        [
          { name: "clear", description: "Clears the console output." },
          { name: "iam", description: "Greets you by name.", usage: "<name>" }
        ],
        [{ name: "fake_odds", description: "Fakes odds.", defaultValue: "0" }]
      )
    ).toEqual([
      "{green}Commands:",
      "  clear        Clears the console output.",
      "  iam <name>   Greets you by name.",
      "{green}ConVars:",
      '  fake_odds    Fakes odds. (default: "0")'
    ]);
  });

  test("sorts entries alphabetically within each section", () => {
    expect(
      formatHelp(
        [
          { name: "version", description: "V." },
          { name: "clear", description: "C." },
          { name: "help", description: "H." }
        ],
        [
          { name: "zeta", description: "Z.", defaultValue: "1" },
          { name: "alpha", description: "A.", defaultValue: "0" }
        ]
      )
    ).toEqual([
      "{green}Commands:",
      "  clear     C.",
      "  help      H.",
      "  version   V.",
      "{green}ConVars:",
      '  alpha     A. (default: "0")',
      '  zeta      Z. (default: "1")'
    ]);
  });

  test("sizes the column to the longest entry across both sections", () => {
    expect(
      formatHelp(
        [{ name: "iam", description: "I.", usage: "<name>" }],
        [{ name: "a_very_long_convar", description: "L.", defaultValue: "" }]
      )
    ).toEqual([
      "{green}Commands:",
      "  iam <name>           I.",
      "{green}ConVars:",
      '  a_very_long_convar   L. (default: "")'
    ]);
  });

  test("omits a section with no entries", () => {
    expect(formatHelp([{ name: "clear", description: "C." }], [])).toEqual([
      "{green}Commands:",
      "  clear   C."
    ]);
    expect(
      formatHelp([], [{ name: "alpha", description: "A.", defaultValue: "0" }])
    ).toEqual(["{green}ConVars:", '  alpha   A. (default: "0")']);
    expect(formatHelp([], [])).toEqual([]);
  });
});
