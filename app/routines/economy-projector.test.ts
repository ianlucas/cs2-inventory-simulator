/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => {
  const state = {
    cs2LibVersion: null as string | null,
    economyProjectionVersion: 1
  };
  const tx = {
    economyItem: { createMany: async () => {}, deleteMany: async () => {} },
    economyPriceSyncState: { updateMany: async () => {} },
    inventoryProjectionState: {
      update: async ({ data }: { data: Partial<typeof state> }) =>
        Object.assign(state, data)
    }
  };
  // Each transaction is held open until the test releases it.
  const transaction = { fail: false, release: () => {} };
  return {
    state,
    transaction,
    prisma: {
      inventoryProjectionState: {
        createMany: async () => {},
        findUniqueOrThrow: async () => ({ ...state })
      },
      $transaction: vi.fn(async (run: (client: typeof tx) => unknown) => {
        await new Promise<void>((resolve) => (transaction.release = resolve));
        if (transaction.fail) {
          throw new Error("Transaction failed.");
        }
        return await run(tx);
      })
    }
  };
});

vi.mock("~/db.server", () => ({ prisma: db.prisma }));
vi.mock("~/shared/monitoring", () => ({ logError: vi.fn() }));

import { logError } from "~/shared/monitoring";
import { EconomyProjector } from "./economy-projector";

beforeEach(() => {
  vi.clearAllMocks();
  db.state.cs2LibVersion = null;
  db.transaction.fail = false;
});

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

async function track<T>(promise: Promise<T>) {
  const tracked = { settled: false, value: undefined as T | undefined };
  void promise.then((value) => {
    tracked.settled = true;
    tracked.value = value;
  });
  await flush();
  return tracked;
}

describe("EconomyProjector", () => {
  it("projects once, however often it's started or asked", async () => {
    const projector = new EconomyProjector();
    projector.start();
    projector.start();
    const current = await track(projector.isCurrentAfterRun());
    db.transaction.release();
    await flush();
    expect(await projector.isCurrentAfterRun()).toBe(true);
    expect(current.value).toBe(true);
    expect(db.prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("waits for the run, then reports that it's current", async () => {
    const projector = new EconomyProjector();
    projector.start();
    const current = await track(projector.isCurrentAfterRun());
    expect(current.settled).toBe(false);
    db.transaction.release();
    await flush();
    expect(current).toEqual({ settled: true, value: true });
  });

  it("logs a failed run and reports that it isn't current", async () => {
    db.transaction.fail = true;
    const projector = new EconomyProjector();
    const current = await track(projector.isCurrentAfterRun());
    db.transaction.release();
    await flush();
    expect(current).toEqual({ settled: true, value: false });
    expect(logError).toHaveBeenCalledWith("Economy projection: failed.", {
      error: expect.any(Error)
    });
  });

  it("skips the rebuild when the stored projection is already current", async () => {
    const first = new EconomyProjector();
    const projected = first.isCurrentAfterRun();
    await flush();
    db.transaction.release();
    await projected;
    expect(await new EconomyProjector().isCurrentAfterRun()).toBe(true);
    expect(db.prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
