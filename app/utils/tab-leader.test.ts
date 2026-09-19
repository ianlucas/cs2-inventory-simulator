/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { afterEach, describe, expect, it, vi } from "vitest";
import { claimTabLock } from "./tab-leader";

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

function grant(available: boolean) {
  const holding = { settled: false };
  const calls = stubLocks(async (name, _options, callback) => {
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

describe("tab lock", () => {
  it("claims the lock when no other tab holds it", async () => {
    const { calls } = grant(true);

    await expect(claimTabLock("icons")).resolves.toBe(true);
    expect(calls[0][0]).toBe("icons");
    expect(calls[0][1]).toEqual({ ifAvailable: true });
  });

  it("declines rather than waiting when another tab holds it", async () => {
    grant(false);

    await expect(claimTabLock("icons")).resolves.toBe(false);
  });

  it("never releases a lock it claimed", async () => {
    const { holding } = grant(true);

    await claimTabLock("icons");
    await Promise.resolve();

    expect(holding.settled).toBe(false);
  });

  it("releases a lock it was not granted", async () => {
    const { holding } = grant(false);

    await claimTabLock("icons");
    await Promise.resolve();

    expect(holding.settled).toBe(true);
  });

  it("claims where the Web Locks API is unavailable", async () => {
    vi.stubGlobal("navigator", {});

    await expect(claimTabLock("icons")).resolves.toBe(true);
  });

  it("claims when the lock request is refused outright", async () => {
    stubLocks(async () => {
      throw new Error("SecurityError");
    });

    await expect(claimTabLock("icons")).resolves.toBe(true);
  });
});
