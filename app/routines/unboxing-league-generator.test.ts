/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Decimal } from "@prisma/client/runtime/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

type Ranking = {
  entries: { rank: number; userId: string }[];
  generatedAt: Date;
  weekStart: Date;
};

const NOW = new Date("2026-10-21T12:00:00.000Z");
const WEEK_START = new Date("2026-10-19T00:00:00.000Z");
const LAST_WEEK_START = new Date("2026-10-12T00:00:00.000Z");
const MINUTE_IN_MS = 60_000;
const ALICE = "76561198000000001";
const BOB = "76561198000000002";
const CAROL = "76561198000000003";

const mocks = vi.hoisted(() => {
  const state = {
    bestDrops: [] as unknown[],
    intervalHours: 1,
    isEnabled: true,
    locked: true,
    privateUserIds: [] as string[],
    rankings: [] as Ranking[],
    totals: [] as unknown[]
  };
  const tx = {
    $queryRaw: vi.fn(async (strings: TemplateStringsArray) =>
      strings.join("").includes("pg_try_advisory_xact_lock")
        ? [{ locked: state.locked }]
        : state.bestDrops
    ),
    unboxingLeagueEntry: { createMany: vi.fn(async () => ({ count: 0 })) },
    unboxingLeagueRanking: {
      create: vi.fn(async () => ({})),
      deleteMany: vi.fn(async () => ({ count: 0 })),
      findMany: vi.fn(async () => state.rankings),
      findUnique: vi.fn(
        async ({ where }: { where: { weekStart: Date } }) =>
          state.rankings.find(
            ({ weekStart }) => weekStart.getTime() === where.weekStart.getTime()
          ) ?? null
      )
    },
    userUnlock: { groupBy: vi.fn(async () => state.totals) }
  };
  return {
    prisma: {
      $transaction: vi.fn(async (run: (client: typeof tx) => unknown) =>
        run(tx)
      ),
      unboxingLeagueRanking: tx.unboxingLeagueRanking
    },
    state,
    tx
  };
});

vi.mock("~/db.server", () => ({ prisma: mocks.prisma }));
vi.mock("~/models/rule.server", () => ({
  appShowCommunity: { isTrueForAnyone: async () => mocks.state.isEnabled },
  communityRankingIntervalHours: { get: async () => mocks.state.intervalHours },
  inventoryAllowProfile: {
    forUsers: async () => (userId: string) =>
      !mocks.state.privateUserIds.includes(userId)
  }
}));

import { generateUnboxingLeague } from "./unboxing-league-generator";

function total(userId: string, payout: number, price: number, minute: number) {
  return {
    _max: { createdAt: new Date(WEEK_START.getTime() + minute * MINUTE_IN_MS) },
    _sum: { payout: new Decimal(payout), price: new Decimal(price) },
    userId
  };
}

function bestDrop(userId: string, itemId: number, payout: number) {
  return {
    itemId,
    payout: new Decimal(payout),
    statTrak: false,
    userId,
    wear: 0.2
  };
}

function ago(minutes: number) {
  return new Date(NOW.getTime() - minutes * MINUTE_IN_MS);
}

const finalLastWeek: Ranking = {
  entries: [],
  generatedAt: new Date(WEEK_START.getTime() + 3 * MINUTE_IN_MS),
  weekStart: LAST_WEEK_START
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.clearAllMocks();
  Object.assign(mocks.state, {
    bestDrops: [
      bestDrop(ALICE, 100, 1200),
      bestDrop(BOB, 200, 40),
      bestDrop(CAROL, 300, 5000)
    ],
    intervalHours: 1,
    isEnabled: true,
    locked: true,
    privateUserIds: [CAROL],
    rankings: [finalLastWeek],
    totals: [
      total(BOB, 900, 1000, 10),
      total(ALICE, 1500, 1000, 20),
      total(CAROL, 6000, 1000, 30)
    ]
  });
});

afterEach(() => {
  vi.useRealTimers();
});

test("ranks this week's players by profit, leaving out private profiles", async () => {
  await generateUnboxingLeague();
  expect(mocks.tx.userUnlock.groupBy).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        counted: true,
        createdAt: {
          gte: WEEK_START,
          lt: new Date("2026-10-26T00:00:00.000Z")
        }
      }
    })
  );
  expect(mocks.tx.unboxingLeagueRanking.deleteMany).toHaveBeenCalledWith({
    where: { weekStart: WEEK_START }
  });
  expect(mocks.tx.unboxingLeagueRanking.create).toHaveBeenCalledWith({
    data: {
      generatedAt: NOW,
      previousGeneratedAt: null,
      rankedCount: 2,
      weekStart: WEEK_START
    }
  });
  expect(mocks.tx.unboxingLeagueEntry.createMany).toHaveBeenCalledWith({
    data: [
      {
        bestItemId: 100,
        bestPayout: new Decimal(1200),
        bestStatTrak: false,
        bestWear: 0.2,
        previousRank: null,
        profit: 500,
        rank: 1,
        userId: ALICE,
        weekStart: WEEK_START
      },
      {
        bestItemId: 200,
        bestPayout: new Decimal(40),
        bestStatTrak: false,
        bestWear: 0.2,
        previousRank: null,
        profit: -100,
        rank: 2,
        userId: BOB,
        weekStart: WEEK_START
      }
    ]
  });
});

test("breaks ties to the cent by who got there first", async () => {
  // 1000.3 - 990.2 and 20.3 - 10.2 are both 10.1 only once rounded.
  mocks.state.totals = [
    total(ALICE, 20.3, 10.2, 20),
    total(BOB, 1000.3, 990.2, 10)
  ];
  await generateUnboxingLeague();
  expect(mocks.tx.unboxingLeagueEntry.createMany).toHaveBeenCalledWith({
    data: [
      expect.objectContaining({ profit: 10.1, rank: 1, userId: BOB }),
      expect.objectContaining({ profit: 10.1, rank: 2, userId: ALICE })
    ]
  });
});

test("carries ranks over from this week's previous snapshot", async () => {
  const previousGeneratedAt = ago(61);
  mocks.state.rankings = [
    finalLastWeek,
    {
      entries: [
        { rank: 1, userId: BOB },
        { rank: 2, userId: ALICE }
      ],
      generatedAt: previousGeneratedAt,
      weekStart: WEEK_START
    }
  ];
  await generateUnboxingLeague();
  expect(mocks.tx.unboxingLeagueRanking.create).toHaveBeenCalledWith({
    data: expect.objectContaining({ previousGeneratedAt })
  });
  expect(mocks.tx.unboxingLeagueEntry.createMany).toHaveBeenCalledWith({
    data: [
      expect.objectContaining({ previousRank: 2, rank: 1, userId: ALICE }),
      expect.objectContaining({ previousRank: 1, rank: 2, userId: BOB })
    ]
  });
});

test("waits for the interval before snapshotting this week again", async () => {
  mocks.state.rankings = [
    finalLastWeek,
    { entries: [], generatedAt: ago(30), weekStart: WEEK_START }
  ];
  await generateUnboxingLeague();
  expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
});

test("snapshots last week once more after it ends", async () => {
  mocks.state.rankings = [
    {
      entries: [],
      generatedAt: new Date(WEEK_START.getTime() - 30 * MINUTE_IN_MS),
      weekStart: LAST_WEEK_START
    },
    { entries: [], generatedAt: ago(10), weekStart: WEEK_START }
  ];
  await generateUnboxingLeague();
  expect(mocks.tx.userUnlock.groupBy).toHaveBeenCalledOnce();
  expect(mocks.tx.userUnlock.groupBy).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        counted: true,
        createdAt: { gte: LAST_WEEK_START, lt: WEEK_START }
      }
    })
  );
  expect(mocks.tx.unboxingLeagueRanking.create).toHaveBeenCalledWith({
    data: expect.objectContaining({
      generatedAt: NOW,
      weekStart: LAST_WEEK_START
    })
  });
});

test("waits a minute after the reset before snapshotting last week", async () => {
  mocks.state.rankings = [
    {
      entries: [],
      generatedAt: new Date(WEEK_START.getTime() - 30 * MINUTE_IN_MS),
      weekStart: LAST_WEEK_START
    }
  ];
  vi.setSystemTime(new Date(WEEK_START.getTime() + 30_000));
  await generateUnboxingLeague();
  expect(mocks.tx.userUnlock.groupBy).toHaveBeenCalledOnce();
  expect(mocks.tx.unboxingLeagueRanking.create).toHaveBeenCalledWith({
    data: expect.objectContaining({ weekStart: WEEK_START })
  });
  vi.clearAllMocks();
  vi.setSystemTime(new Date(WEEK_START.getTime() + MINUTE_IN_MS));
  await generateUnboxingLeague();
  expect(mocks.tx.unboxingLeagueRanking.create).toHaveBeenCalledWith({
    data: expect.objectContaining({ weekStart: LAST_WEEK_START })
  });
});

test("does nothing while the Community is off for everyone", async () => {
  mocks.state.isEnabled = false;
  await generateUnboxingLeague();
  expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
});

test("snapshots this week on every check with a 0 interval", async () => {
  mocks.state.intervalHours = 0;
  mocks.state.rankings = [
    finalLastWeek,
    { entries: [], generatedAt: ago(1), weekStart: WEEK_START }
  ];
  await generateUnboxingLeague();
  expect(mocks.tx.unboxingLeagueRanking.create).toHaveBeenCalledWith({
    data: expect.objectContaining({ weekStart: WEEK_START })
  });
});

test("leaves generation to the process holding the lock", async () => {
  mocks.state.locked = false;
  await generateUnboxingLeague();
  expect(mocks.tx.unboxingLeagueRanking.create).not.toHaveBeenCalled();
});
