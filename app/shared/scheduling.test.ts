/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./monitoring", () => ({ logError: vi.fn() }));

import { logError } from "./monitoring";
import { Job, Loop } from "./scheduling";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

describe("Loop", () => {
  it("stops when tick returns undefined and can be started again", async () => {
    const delays = [1_000, undefined, undefined];
    const tick = vi.fn(async () => delays.shift());
    const loop = new Loop(tick);
    loop.start();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(tick).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(tick).toHaveBeenCalledTimes(2);
    loop.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(tick).toHaveBeenCalledTimes(3);
  });
});

describe("Job", () => {
  it("runs right away on start", () => {
    const run = vi.fn(async () => {});
    new Job("Test", 1_000, run).start();
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("ignores repeated start calls", async () => {
    const run = vi.fn(async () => {});
    const job = new Job("Test", 1_000, run);
    job.start();
    job.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("waits the interval after each run finishes, so runs never overlap", async () => {
    const run = vi.fn(() => sleep(5_000));
    new Job("Test", 1_000, run).start();
    await vi.advanceTimersByTimeAsync(5_999);
    expect(run).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("logs a failed run and keeps its schedule", async () => {
    const error = new Error("boom");
    const run = vi.fn(async () => {
      throw error;
    });
    new Job("Test", 1_000, run).start();
    await vi.advanceTimersByTimeAsync(0);
    expect(logError).toHaveBeenCalledWith("Test: job failed.", { error });
    await vi.advanceTimersByTimeAsync(1_000);
    expect(run).toHaveBeenCalledTimes(2);
  });
});
