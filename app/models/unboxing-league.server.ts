/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { prisma } from "~/db.server";
import {
  findUnboxingWeek,
  getUnboxingWeekStarts,
  roundSimulatorDollars,
  UNBOXING_LEAGUE_RANKING_SIZE,
  WEEK_IN_MS
} from "~/shared/unboxing-league";
import { getUnboxingBalance, getUnboxingProfit } from "./user-unlock.server";

const entrySelect = {
  bestItemId: true,
  bestPayout: true,
  bestStatTrak: true,
  bestWear: true,
  previousRank: true,
  profit: true,
  rank: true,
  user: { select: { avatar: true, id: true, name: true } },
  weekStart: true
} as const;

function toBestDrop(drop: {
  itemId: number;
  payout: { toNumber(): number };
  statTrak: boolean;
  wear: number | null;
}) {
  return {
    itemId: drop.itemId,
    payout: drop.payout.toNumber(),
    statTrak: drop.statTrak,
    wear: drop.wear ?? undefined
  };
}

function toRow({
  bestItemId,
  bestPayout,
  bestStatTrak,
  bestWear,
  previousRank,
  profit,
  rank,
  user
}: {
  bestItemId: number;
  bestPayout: { toNumber(): number };
  bestStatTrak: boolean;
  bestWear: number | null;
  previousRank: number | null;
  profit: { toNumber(): number };
  rank: number;
  user: { avatar: string; id: string; name: string };
}) {
  return {
    avatar: user.avatar,
    bestDrop: toBestDrop({
      itemId: bestItemId,
      payout: bestPayout,
      statTrak: bestStatTrak,
      wear: bestWear
    }),
    name: user.name,
    previousRank,
    profit: profit.toNumber(),
    rank,
    userId: user.id
  };
}

/**
 * Finds the top of this week's and last week's snapshots and, for a signed-in
 * user, their own entry (`null` when they aren't ranked).
 */
export async function getUnboxingLeague(userId: string | undefined, now: Date) {
  const { lastWeekStart, weekStart } = getUnboxingWeekStarts(now);
  const [rankings, viewerEntries] = await Promise.all([
    prisma.unboxingLeagueRanking.findMany({
      select: {
        entries: {
          orderBy: { rank: "asc" },
          select: entrySelect,
          where: { rank: { lte: UNBOXING_LEAGUE_RANKING_SIZE } }
        },
        generatedAt: true,
        previousGeneratedAt: true,
        rankedCount: true,
        weekStart: true
      },
      where: { weekStart: { in: [lastWeekStart, weekStart] } }
    }),
    userId === undefined
      ? []
      : prisma.unboxingLeagueEntry.findMany({
          select: entrySelect,
          where: { userId, weekStart: { in: [lastWeekStart, weekStart] } }
        })
  ]);
  function getRanking(start: Date) {
    const ranking = findUnboxingWeek(rankings, start);
    const viewerEntry = findUnboxingWeek(viewerEntries, start);
    return {
      generatedAt: ranking?.generatedAt,
      hasMovement: ranking?.previousGeneratedAt != null,
      rankedCount: ranking?.rankedCount ?? 0,
      rows: ranking?.entries.map(toRow) ?? [],
      viewer:
        userId === undefined
          ? undefined
          : viewerEntry === undefined
            ? null
            : toRow(viewerEntry)
    };
  }
  return {
    lastWeek: getRanking(lastWeekStart),
    resetsAt: new Date(weekStart.getTime() + WEEK_IN_MS),
    thisWeek: getRanking(weekStart)
  };
}

/**
 * The user's live results this week and last week, plus their ranks from the
 * snapshots.
 */
export async function getUnboxingStats(
  userId: string,
  { budget, now }: { budget: number; now: Date }
) {
  const { lastWeekStart, weekStart } = getUnboxingWeekStarts(now);
  const where = { createdAt: { gte: weekStart, lte: now }, userId };
  const [balance, unlocks, bestDrop, lastUnlock, lastWeekTotals, entries] =
    await Promise.all([
      getUnboxingBalance(prisma, { budget, now, userId }),
      prisma.userUnlock.count({ where: { ...where, counted: true } }),
      prisma.userUnlock.findFirst({
        orderBy: [{ payout: "desc" }, { createdAt: "desc" }],
        select: { itemId: true, payout: true, statTrak: true, wear: true },
        where: { ...where, counted: true }
      }),
      prisma.userUnlock.findFirst({
        orderBy: { createdAt: "desc" },
        select: { price: true },
        where
      }),
      prisma.userUnlock.aggregate({
        _count: true,
        _sum: { payout: true, price: true },
        where: {
          counted: true,
          createdAt: { gte: lastWeekStart, lt: weekStart },
          userId
        }
      }),
      prisma.unboxingLeagueEntry.findMany({
        select: {
          rank: true,
          ranking: { select: { generatedAt: true, rankedCount: true } },
          weekStart: true
        },
        where: { userId, weekStart: { in: [lastWeekStart, weekStart] } }
      })
    ]);
  function getRank(start: Date) {
    const entry = findUnboxingWeek(entries, start);
    return entry === undefined
      ? undefined
      : {
          generatedAt: entry.ranking.generatedAt,
          rank: entry.rank,
          rankedCount: entry.ranking.rankedCount
        };
  }
  return {
    balance,
    bestDrop: bestDrop === null ? undefined : toBestDrop(bestDrop),
    // Counting is decided per container, so this only tells whether the
    // container the user last unlocked has become unaffordable.
    isOutOfBudget: lastUnlock !== null && balance < lastUnlock.price.toNumber(),
    lastWeek:
      lastWeekTotals._count === 0
        ? undefined
        : {
            profit: getUnboxingProfit(lastWeekTotals._sum),
            rank: getRank(lastWeekStart)
          },
    profit: roundSimulatorDollars(balance - budget),
    rank: getRank(weekStart),
    unlocks
  };
}
