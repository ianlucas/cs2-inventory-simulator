/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { afterEach, describe, expect, it, vi } from "vitest";
import { holdWebLock } from "./web-lock.client";

type RequestArgs =
  | [string, LockOptions, LockGrantedCallback<unknown>]
  | [string, LockGrantedCallback<unknown>];

function argsOf(args: RequestArgs) {
  return args.length === 3
    ? { callback: args[2], name: args[0], options: args[1] }
    : { callback: args[1], name: args[0], options: undefined };
}

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

function grant(available: boolean) {
  const holding = { settled: false };
  const calls = stubLocks(async (...args) => {
    const { callback, name } = argsOf(args);
    const held = callback(
      available ? ({ mode: "exclusive", name } as Lock) : null
    );
    void Promise.resolve(held).then(() => {
      holding.settled = true;
    });
  });
  return { calls, holding };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("web lock", () => {
  it("claims the lock when no other tab holds it", async () => {
    const { calls } = grant(true);

    await expect(holdWebLock("icons")).resolves.toBe(true);
    expect(argsOf(calls[0]).name).toBe("icons");
    expect(argsOf(calls[0]).options).toEqual({ ifAvailable: true });
  });

  it("declines rather than waiting when another tab holds it", async () => {
    grant(false);

    await expect(holdWebLock("icons")).resolves.toBe(false);
  });

  it("never releases a lock it claimed", async () => {
    const { holding } = grant(true);

    await holdWebLock("icons");
    await Promise.resolve();

    expect(holding.settled).toBe(false);
  });

  it("releases a lock it was not granted", async () => {
    const { holding } = grant(false);

    await holdWebLock("icons");
    await Promise.resolve();

    expect(holding.settled).toBe(true);
  });

  it("declines where the Web Locks API is unavailable, rather than letting every tab claim", async () => {
    vi.stubGlobal("navigator", {});

    await expect(holdWebLock("icons")).resolves.toBe(false);
  });

  it("declines when the lock request is refused outright", async () => {
    stubLocks(async () => {
      throw new Error("SecurityError");
    });

    await expect(holdWebLock("icons")).resolves.toBe(false);
  });
});
