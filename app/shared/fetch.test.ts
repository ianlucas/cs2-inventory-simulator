/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { isAbortError, isNetworkError, retryOnNetworkError } from "./fetch";

describe("isNetworkError", () => {
  test.each([
    "Failed to fetch",
    "Load failed",
    "NetworkError when attempting to fetch resource.",
    "network error",
    "Content-Length header of network response exceeds response Body."
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

describe("isAbortError", () => {
  test("matches aborted requests", () => {
    expect(
      isAbortError(
        new DOMException("The operation was aborted. ", "AbortError")
      )
    ).toBe(true);
  });

  test("ignores other errors", () => {
    expect(
      isAbortError(new DOMException("The operation timed out.", "TimeoutError"))
    ).toBe(false);
    expect(isAbortError(new TypeError("Failed to fetch"))).toBe(false);
    expect(isAbortError(undefined)).toBe(false);
  });
});

describe("retryOnNetworkError", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("retries network errors with increasing delays", async () => {
    const request = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValue("ok");
    const result = retryOnNetworkError(request);
    await vi.advanceTimersByTimeAsync(999);
    expect(request).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(request).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1999);
    expect(request).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(request).toHaveBeenCalledTimes(3);
    await expect(result).resolves.toBe("ok");
  });

  test("keeps retrying at the longest delay", async () => {
    const request = vi
      .fn<() => Promise<string>>()
      .mockRejectedValue(new TypeError("Failed to fetch"));
    retryOnNetworkError(request);
    await vi.advanceTimersByTimeAsync(1000 + 2000 + 5000 + 10000);
    expect(request).toHaveBeenCalledTimes(5);
    await vi.advanceTimersByTimeAsync(10000);
    expect(request).toHaveBeenCalledTimes(6);
  });

  test("throws other errors without retrying", async () => {
    const error = new SyntaxError("Unexpected token '<'");
    const request = vi.fn<() => Promise<string>>().mockRejectedValue(error);
    await expect(retryOnNetworkError(request)).rejects.toBe(error);
    expect(request).toHaveBeenCalledTimes(1);
  });
});
