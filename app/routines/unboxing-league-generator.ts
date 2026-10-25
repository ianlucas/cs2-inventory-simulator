/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { prisma } from "~/db.server";
import type { Prisma } from "~/generated/prisma/client";
import {
  appShowCommunity,
  communityRankingIntervalHours,
  inventoryAllowProfile
} from "~/models/rule.server";
import { Job } from "~/shared/scheduling";
import {
  getUnboxingWeekStart,
  rankUnboxingLeague,
  WEEK_IN_MS
} from "~/shared/unboxing-league";
import { singleton } from "~/singleton.server";

const CHECK_INTERVAL_MS = 5 * 60_000;
const ENTRY_INSERT_BATCH_SIZE = 1_000;
const HOUR_IN_MS = 60 * 60_000;
const LOCK_KEY = "unboxing-league-generator";
const RULE_BATCH_SIZE = 5_000;

type Client = Prisma.TransactionClient;

interface BestDrop {
  itemId: number;
  payout: Prisma.Decimal;
  statTrak: boolean;
  userId: string;
  wear: number | null;
}

// Last week is due until it has a snapshot taken after it ended, and this week
// once its snapshot is `intervalHours` old.
async function getDueWeekStarts(
  client: Client,
  intervalHours: number,
  now: Date
) {
  const weekStart = getUnboxingWeekStart(now);
  const lastWeekStart = new Date(weekStart.getTime() - WEEK_IN_MS);
  const rankings = await client.unboxingLeagueRanking.findMany({
    select: { generatedAt: true, weekStart: true },
    where: { weekStart: { in: [lastWeekStart, weekStart] } }
  });
  const getGeneratedAt = (start: Date) =>
    rankings
      .find((ranking) => ranking.weekStart.getTime() === start.getTime())
      ?.generatedAt.getTime();
  const lastWeekGeneratedAt = getGeneratedAt(lastWeekStart);
  const weekGeneratedAt = getGeneratedAt(weekStart);
  return [
    ...(lastWeekGeneratedAt === undefined ||
    lastWeekGeneratedAt < weekStart.getTime()
      ? [lastWeekStart]
      : []),
    ...(weekGeneratedAt === undefined ||
    weekGeneratedAt + intervalHours * HOUR_IN_MS <= now.getTime()
      ? [weekStart]
      : [])
  ];
}

async function getProfileAllowedUserIds(userIds: string[]) {
  const allowed = new Set<string>();
  for (let index = 0; index < userIds.length; index += RULE_BATCH_SIZE) {
    const batch = userIds.slice(index, index + RULE_BATCH_SIZE);
    const isAllowed = await inventoryAllowProfile.forUsers(batch);
    for (const userId of batch) {
      if (isAllowed(userId)) {
        allowed.add(userId);
      }
    }
  }
  return allowed;
}

async function generate(tx: Client, weekStart: Date, now: Date) {
  const weekEnd = new Date(weekStart.getTime() + WEEK_IN_MS);
  const [totals, bestDrops, previous] = await Promise.all([
    tx.userUnlock.groupBy({
      _max: { createdAt: true },
      _sum: { payout: true, price: true },
      by: ["userId"],
      where: { counted: true, createdAt: { gte: weekStart, lt: weekEnd } }
    }),
    tx.$queryRaw<BestDrop[]>`
      SELECT DISTINCT ON ("userId") "userId", "itemId", "payout", "statTrak", "wear"
      FROM "UserUnlock"
      WHERE "counted" AND "createdAt" >= ${weekStart} AND "createdAt" < ${weekEnd}
      ORDER BY "userId", "payout" DESC, "createdAt" DESC
    `,
    tx.unboxingLeagueRanking.findUnique({
      select: {
        entries: { select: { rank: true, userId: true } },
        generatedAt: true
      },
      where: { weekStart }
    })
  ]);
  const allowedUserIds = await getProfileAllowedUserIds(
    totals.map(({ userId }) => userId)
  );
  const bestDropByUserId = new Map(
    bestDrops.map((drop) => [drop.userId, drop])
  );
  const entries = rankUnboxingLeague(
    totals.flatMap(({ _max, _sum, userId }) => {
      const bestDrop = bestDropByUserId.get(userId);
      if (
        !allowedUserIds.has(userId) ||
        bestDrop === undefined ||
        _max.createdAt === null
      ) {
        return [];
      }
      return [
        {
          bestDrop,
          lastUnlockedAt: _max.createdAt,
          profit:
            (_sum.payout?.toNumber() ?? 0) - (_sum.price?.toNumber() ?? 0),
          userId
        }
      ];
    }),
    new Map(previous?.entries.map(({ rank, userId }) => [userId, rank]))
  );
  await tx.unboxingLeagueRanking.deleteMany({ where: { weekStart } });
  await tx.unboxingLeagueRanking.create({
    data: {
      generatedAt: now,
      previousGeneratedAt: previous?.generatedAt ?? null,
      rankedCount: entries.length,
      weekStart
    }
  });
  for (
    let index = 0;
    index < entries.length;
    index += ENTRY_INSERT_BATCH_SIZE
  ) {
    await tx.unboxingLeagueEntry.createMany({
      data: entries
        .slice(index, index + ENTRY_INSERT_BATCH_SIZE)
        .map(({ bestDrop, previousRank, profit, rank, userId }) => ({
          bestItemId: bestDrop.itemId,
          bestPayout: bestDrop.payout,
          bestStatTrak: bestDrop.statTrak,
          bestWear: bestDrop.wear,
          previousRank,
          profit: Math.round(profit * 100) / 100,
          rank,
          userId,
          weekStart
        }))
    });
  }
}

/**
 * Snapshots this week's Unboxing League every `communityRankingIntervalHours`,
 * and last week's once more after it ends so its final ranks are exact. An
 * advisory lock keeps overlapping processes from generating them twice.
 */
export async function generateUnboxingLeague() {
  if (!(await appShowCommunity.isTrueForAnyone())) {
    return;
  }
  const intervalHours = await communityRankingIntervalHours.get();
  if (
    intervalHours <= 0 ||
    (await getDueWeekStarts(prisma, intervalHours, new Date())).length === 0
  ) {
    return;
  }
  await prisma.$transaction(
    async (tx) => {
      const [{ locked }] = await tx.$queryRaw<[{ locked: boolean }]>`
        SELECT pg_try_advisory_xact_lock(hashtext(${LOCK_KEY})) AS "locked"
      `;
      if (!locked) {
        return;
      }
      // Another process may have generated them since the check above.
      const now = new Date();
      for (const weekStart of await getDueWeekStarts(tx, intervalHours, now)) {
        await generate(tx, weekStart, now);
      }
    },
    { maxWait: 30_000, timeout: 15 * 60_000 }
  );
}

export const unboxingLeagueGenerator = singleton(
  "unboxingLeagueGenerator",
  () =>
    new Job(
      "Unboxing League generator",
      CHECK_INTERVAL_MS,
      generateUnboxingLeague
    )
);
