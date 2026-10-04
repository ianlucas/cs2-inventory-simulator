/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { afterEach, describe, expect, it, vi } from "vitest";
import { requestWebLock } from "./web-lock.client";

type RequestArgs = [string, LockOptions, LockGrantedCallback<unknown>];

function stubLocks(request: (...args: RequestArgs) => Promise<unknown>) {
  const calls: RequestArgs[] = [];
  vi.stubGlobal("navigator", {
    locks: {
      request: (...args: RequestArgs) => {
        calls.push(args);
        return request(...args);
      }
    }
  });
  return calls;
}

function grant() {
  const holding = { settled: false };
  const calls = stubLocks(async (name, _options, callback) => {
    await callback({ mode: "exclusive", name } as Lock);
    holding.settled = true;
  });
  return { calls, holding };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("web lock", () => {
  it("waits in line for the lock, rather than declining when another tab holds it", async () => {
    const { calls } = grant();
    const signal = new AbortController().signal;

    await expect(requestWebLock("icons", signal)).resolves.toBeTypeOf(
      "function"
    );
    expect(calls[0][0]).toBe("icons");
    expect(calls[0][1]).toEqual({ signal });
  });

  it("holds the lock until released", async () => {
    const { holding } = grant();

    const release = await requestWebLock("icons", new AbortController().signal);
    await Promise.resolve();
    expect(holding.settled).toBe(false);

    release?.();
    await Promise.resolve();
    expect(holding.settled).toBe(true);
  });

  it("gives up its place in line when aborted", async () => {
    stubLocks(
      (_name, { signal }) =>
        new Promise((_resolve, reject) =>
          signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError"))
          )
        )
    );
    const controller = new AbortController();

    const request = requestWebLock("icons", controller.signal);
    controller.abort();

    await expect(request).resolves.toBeUndefined();
  });

  it("declines where the Web Locks API is unavailable, rather than letting every tab claim", async () => {
    vi.stubGlobal("navigator", {});

    await expect(
      requestWebLock("icons", new AbortController().signal)
    ).resolves.toBeUndefined();
  });

  it("declines when the lock request is refused outright", async () => {
    stubLocks(async () => {
      throw new Error("SecurityError");
    });

    await expect(
      requestWebLock("icons", new AbortController().signal)
    ).resolves.toBeUndefined();
  });
});
