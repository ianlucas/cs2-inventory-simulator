/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { beforeEach, describe, expect, test } from "vitest";
import { ConVar } from "./console";

beforeEach(() => {
  window.localStorage.clear();
});

describe("ConVar", () => {
  test("returns default value when unset", () => {
    const convar = new ConVar("test_default", "5");
    expect(convar.value).toBe("5");
  });

  test("persists and reads back assigned value", () => {
    const convar = new ConVar("test_assign", "0");
    convar.value = "10";
    expect(convar.value).toBe("10");
    expect(new ConVar("test_assign", "0").value).toBe("10");
  });

  test("does not clobber other convars in storage", () => {
    const first = new ConVar("test_first", "0");
    const second = new ConVar("test_second", "0");
    first.value = "1";
    second.value = "2";
    expect(first.value).toBe("1");
    expect(second.value).toBe("2");
  });

  test("falls back to default on corrupted storage", () => {
    window.localStorage.setItem("convars", "not json");
    const convar = new ConVar("test_corrupted", "3");
    expect(convar.value).toBe("3");
  });

  test("toBoolean coerces values", () => {
    const convar = new ConVar("test_boolean", "0");
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
