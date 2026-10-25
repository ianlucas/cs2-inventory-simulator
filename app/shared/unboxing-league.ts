/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  assert,
  CS2_RARITY_ORDER,
  type CS2EconomyItem,
  type CS2UnlockableItem,
  ensure
} from "@ianlucas/cs2-lib";

export const UNBOXING_LEAGUE_FLOAT_CAP = 0.01;
export const UNBOXING_LEAGUE_RANKING_SIZE = 5;
export const WEEK_IN_MS = 7 * 24 * 60 * 60_000;

const DAY_IN_MS = 24 * 60 * 60_000;

export interface UnboxingResult {
  balance: number;
  counted: boolean;
  payout: number;
}

export interface UnboxingDrop {
  id: number;
  statTrak: boolean;
  wear: number | undefined;
}

// The chances of a drop group, a rarity with or without StatTrak, ordered from
// the best group to the worst.
interface DropGroup {
  better: number;
  noWear: number;
  wear: number;
}

interface ContainerOdds {
  groups: Map<string, DropGroup>;
  price: number;
  unlockables: Map<number, CS2UnlockableItem>;
}

const oddsByContainerId = new Map<number, ContainerOdds>();

function getGroupKey(rarity: string, statTrak: boolean) {
  return `${rarity}:${statTrak}`;
}

function getWearRange({ wearMax, wearMin }: CS2UnlockableItem) {
  return wearMin !== undefined && wearMax !== undefined && wearMax > wearMin
    ? { max: wearMax, min: wearMin }
    : undefined;
}

// Lower floats are better, and floats in the best `UNBOXING_LEAGUE_FLOAT_CAP`
// of the range all pay the most. Items without float rank as the worst.
function getWearPercentile(unlockable: CS2UnlockableItem, wear?: number) {
  const range = getWearRange(unlockable);
  if (range === undefined || wear === undefined) {
    return 1;
  }
  const percentile = (wear - range.min) / (range.max - range.min);
  return Math.min(1, Math.max(UNBOXING_LEAGUE_FLOAT_CAP, percentile));
}

// Average of 1 / (better + wear * percentile) over a uniform percentile,
// with percentiles under the cap paying as the cap.
function getAveragePayout({ better, noWear, wear }: DropGroup) {
  let average = 0;
  if (wear > 0) {
    const capped = better + wear * UNBOXING_LEAGUE_FLOAT_CAP;
    average +=
      (wear * UNBOXING_LEAGUE_FLOAT_CAP) / capped +
      Math.log((better + wear) / capped);
  }
  if (noWear > 0) {
    average += noWear / (better + wear + noWear);
  }
  return average;
}

function getContainerOdds(container: CS2EconomyItem): ContainerOdds {
  let odds = oddsByContainerId.get(container.id);
  if (odds !== undefined) {
    return odds;
  }
  const unlockables = container.listUnlockableItems();
  const rarities = [...new Set(unlockables.map(({ rarity }) => rarity))].sort(
    (a, b) => CS2_RARITY_ORDER.indexOf(b) - CS2_RARITY_ORDER.indexOf(a)
  );
  const groups = new Map<string, DropGroup>();
  let better = 0;
  let price = 0;
  for (const rarity of rarities) {
    for (const statTrak of [true, false]) {
      const group: DropGroup = { better, noWear: 0, wear: 0 };
      for (const unlockable of unlockables) {
        if (unlockable.rarity !== rarity) {
          continue;
        }
        const chance =
          unlockable.chance *
          (statTrak
            ? unlockable.statTrakChance
            : 1 - unlockable.statTrakChance);
        if (getWearRange(unlockable) !== undefined) {
          group.wear += chance;
        } else {
          group.noWear += chance;
        }
      }
      groups.set(getGroupKey(rarity, statTrak), group);
      price += getAveragePayout(group);
      better += group.wear + group.noWear;
    }
  }
  odds = {
    groups,
    price,
    unlockables: new Map(unlockables.map((item) => [item.id, item]))
  };
  oddsByContainerId.set(container.id, odds);
  return odds;
}

/**
 * Pays how many unlocks of the container it takes, on average, to get a drop
 * at least this good: rarer first, then StatTrak, then a lower float.
 */
export function getUnboxingPayout(
  container: CS2EconomyItem,
  drop: UnboxingDrop
) {
  const { groups, unlockables } = getContainerOdds(container);
  const unlockable = ensure(unlockables.get(drop.id));
  const group = ensure(
    groups.get(getGroupKey(unlockable.rarity, drop.statTrak))
  );
  const percentile = getWearPercentile(unlockable, drop.wear);
  const chance =
    group.better +
    (percentile < 1 ? group.wear * percentile : group.wear + group.noWear);
  assert(chance > 0);
  return 1 / chance;
}

export function getUnboxingRarity(container: CS2EconomyItem, id: number) {
  return ensure(getContainerOdds(container).unlockables.get(id)).rarity;
}

/**
 * The container's average payout, so unlocking any container is a fair bet.
 */
export function getUnboxingPrice(container: CS2EconomyItem) {
  return getContainerOdds(container).price;
}

export function roundSimulatorDollars(value: number) {
  return Math.round(value * 100) / 100;
}

export function getUnboxingWeekStart(date: Date) {
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) -
      daysSinceMonday * DAY_IN_MS
  );
}

export function formatSimulatorDollars(
  value: number,
  locale?: string,
  signed = false
) {
  const absolute = Math.abs(value);
  const sign = value < 0 ? "-" : signed && value > 0 ? "+" : "";
  try {
    const formatted = new Intl.NumberFormat(
      locale,
      absolute >= 10_000
        ? { maximumFractionDigits: 1, notation: "compact" }
        : { maximumFractionDigits: 2, minimumFractionDigits: 2 }
    ).format(absolute);
    return `${sign}S$${formatted}`;
  } catch {
    return `${sign}S$${absolute.toFixed(2)}`;
  }
}

export interface UnboxingLeaguePlayer {
  lastUnlockedAt: Date;
  profit: number;
  userId: string;
}

/**
 * Ranks by profit, then by who got there first, then by user id so each
 * player has their own rank.
 */
export function rankUnboxingLeague<T extends UnboxingLeaguePlayer>(
  players: T[],
  previousRankByUserId: Map<string, number>
) {
  return [...players]
    .sort(
      (a, b) =>
        b.profit - a.profit ||
        a.lastUnlockedAt.getTime() - b.lastUnlockedAt.getTime() ||
        (a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0)
    )
    .map((player, index) => ({
      ...player,
      previousRank: previousRankByUserId.get(player.userId) ?? null,
      rank: index + 1
    }));
}
