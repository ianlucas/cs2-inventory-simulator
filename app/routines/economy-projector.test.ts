/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { beforeEach, describe, expect, it, vi } from "vitest";

type Item = { id: number; name: string; removed: boolean };

const lib = vi.hoisted(() => ({
  items: [] as { id: number; name: string; type: string }[]
}));

const db = vi.hoisted(() => {
  const state = {
    cs2LibVersion: null as string | null,
    economyProjectionVersion: 1
  };
  const items = new Map<number, Item>();
  const tx = {
    economyItem: {
      createMany: async ({ data }: { data: Item[] }) => {
        for (const item of data) {
          items.set(item.id, { ...item });
        }
      },
      findMany: async () => [...items.values()].map((item) => ({ ...item })),
      update: vi.fn(
        async ({ data, where }: { data: Item; where: { id: number } }) =>
          items.set(where.id, { ...data })
      ),
      updateMany: async ({
        data,
        where
      }: {
        data: Partial<Item>;
        where: { id: { in: number[] } };
      }) => {
        for (const item of items.values()) {
          if (where.id.in.includes(item.id)) {
            Object.assign(item, data);
          }
        }
      }
    },
    economyProjectionState: {
      update: async ({ data }: { data: Partial<typeof state> }) =>
        Object.assign(state, data)
    }
  };
  // Each transaction is held open until the test releases it.
  const transaction = { fail: false, release: () => {} };
  return {
    items,
    state,
    transaction,
    tx,
    prisma: {
      economyProjectionState: {
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

vi.mock("@ianlucas/cs2-lib", () => ({
  CS2Economy: {
    get itemsAsArray() {
      return lib.items;
    }
  }
}));
vi.mock("~/db.server", () => ({ prisma: db.prisma }));
vi.mock("~/shared/monitoring", () => ({ logError: vi.fn() }));

import { logError } from "~/shared/monitoring";
import { EconomyProjector } from "./economy-projector";

beforeEach(() => {
  vi.clearAllMocks();
  db.state.cs2LibVersion = null;
  db.transaction.fail = false;
  db.items.clear();
  lib.items = [];
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

  it("updates items in place and flags the ones cs2-lib dropped as removed", async () => {
    const stored = (id: number, name: string, removed = false) => ({
      altName: null,
      base: false,
      baseItemId: null,
      category: null,
      collectionKey: null,
      def: null,
      free: false,
      id,
      modelKey: null,
      name,
      rarityColor: null,
      removed,
      type: "weapon"
    });
    await db.tx.economyItem.createMany({
      data: [
        stored(1, "Kept"),
        stored(2, "Old name"),
        stored(3, "Dropped"),
        stored(4, "Restored", true)
      ]
    });
    lib.items = [
      { id: 1, name: "Kept", type: "weapon" },
      { id: 2, name: "New name", type: "weapon" },
      { id: 4, name: "Restored", type: "weapon" },
      { id: 5, name: "Added", type: "weapon" }
    ];
    const projected = new EconomyProjector().isCurrentAfterRun();
    await flush();
    db.transaction.release();
    expect(await projected).toBe(true);
    expect(db.tx.economyItem.update).toHaveBeenCalledTimes(2);
    expect(
      [...db.items.values()].map(({ id, name, removed }) => ({
        id,
        name,
        removed
      }))
    ).toEqual([
      { id: 1, name: "Kept", removed: false },
      { id: 2, name: "New name", removed: false },
      { id: 3, name: "Dropped", removed: true },
      { id: 4, name: "Restored", removed: false },
      { id: 5, name: "Added", removed: false }
    ]);
  });
});
