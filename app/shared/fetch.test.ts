/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, test } from "vitest";
import { isNetworkError } from "./fetch";

describe("isNetworkError", () => {
  test.each([
    "Failed to fetch",
    "Load failed",
    "NetworkError when attempting to fetch resource.",
    "network error"
  ])("matches '%s'", (message) => {
    expect(isNetworkError(new TypeError(message))).toBe(true);
    expect(isNetworkError(new TypeError(`${message} (example.com)`))).toBe(
      true
    );
  });

  test("ignores other errors with the same message", () => {
    expect(isNetworkError(new Error("Failed to fetch"))).toBe(false);
  });

  test("matches network errors wrapped as the cause", () => {
    expect(
      isNetworkError(
        new Error("Unable to decode turbo-stream response", {
          cause: new TypeError("network error")
        })
      )
    ).toBe(true);
  });

  test("ignores wrapped errors with other causes", () => {
    expect(
      isNetworkError(
        new Error("Unable to decode turbo-stream response", {
          cause: new SyntaxError()
        })
      )
    ).toBe(false);
  });

  test("ignores aborted requests", () => {
    expect(
      isNetworkError(
        new DOMException("The user aborted a request.", "AbortError")
      )
    ).toBe(false);
  });

  test("ignores other type errors", () => {
    expect(
      isNetworkError(new TypeError("Cannot read properties of undefined"))
    ).toBe(false);
  });

  test("ignores non-errors", () => {
    expect(isNetworkError("Failed to fetch")).toBe(false);
    expect(isNetworkError(undefined)).toBe(false);
  });
});
