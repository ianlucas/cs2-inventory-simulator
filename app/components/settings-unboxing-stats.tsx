/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { assert } from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { useRouteLoaderData } from "react-router";
import type { loader as settingsLoader } from "~/routes/settings._index";
import { format } from "~/shared/number";
import { formatRelativeTime } from "~/shared/relative-time";
import { formatSimulatorDollars } from "~/shared/unboxing-league";
import { usePreferences, useTranslate } from "./app-context";
import { SettingsLabel } from "./settings-label";
import { BestDrop } from "./unboxing-league-ranking";

function Profit({ value }: { value: number }) {
  const { lang } = usePreferences();
  return (
    <span
      className={clsx(
        "font-display tabular-nums",
        value < 0 ? "text-red-400" : "text-emerald-400"
      )}
    >
      {formatSimulatorDollars(value, lang, true)}
    </span>
  );
}

export function SettingsUnboxingStats() {
  const translate = useTranslate();
  const { lang } = usePreferences();
  const data = useRouteLoaderData<typeof settingsLoader>(
    "routes/settings._index"
  );
  assert(data?.stats !== undefined);
  const { now, stats } = data;
  const { lastWeek, rank } = stats;

  return (
    <div className="space-y-2">
      <h3 className="font-display px-1 pt-1 font-semibold text-neutral-300 uppercase">
        {translate("CommunityTitle")} · {translate("CommunityThisWeek")}
      </h3>
      <SettingsLabel label={translate("SettingsStatsBalance")}>
        <span className="font-display text-white tabular-nums">
          {formatSimulatorDollars(stats.balance, lang)}
        </span>
      </SettingsLabel>
      {stats.isOutOfBudget && (
        <p className="rounded-sm bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {translate("SettingsStatsOutOfBudget")}
        </p>
      )}
      <SettingsLabel label={translate("SettingsStatsProfit")}>
        <Profit value={stats.profit} />
      </SettingsLabel>
      <SettingsLabel label={translate("SettingsStatsUnlocks")}>
        <span className="font-display text-white tabular-nums">
          {format(stats.unlocks, lang)}
        </span>
      </SettingsLabel>
      {stats.bestDrop !== undefined && (
        <SettingsLabel label={translate("SettingsStatsBestDrop")}>
          <BestDrop drop={stats.bestDrop} />
        </SettingsLabel>
      )}
      <SettingsLabel label={translate("SettingsStatsRank")}>
        <span className="text-right text-sm text-neutral-300">
          {rank !== undefined ? (
            <>
              <span className="font-display text-white">
                {translate(
                  "CommunityRankOf",
                  format(rank.rank, lang),
                  format(rank.rankedCount, lang)
                )}
              </span>
              <span className="block text-xs text-neutral-400">
                {translate(
                  "CommunityUpdatedAt",
                  formatRelativeTime(new Date(rank.generatedAt), now, lang)
                )}
              </span>
            </>
          ) : (
            translate("CommunityNotRanked")
          )}
        </span>
      </SettingsLabel>
      <h3 className="font-display px-1 pt-2 font-semibold text-neutral-300 uppercase">
        {translate("CommunityTitle")} · {translate("CommunityLastWeek")}
      </h3>
      {lastWeek !== undefined ? (
        <>
          {lastWeek.rank !== undefined && (
            <SettingsLabel label={translate("SettingsStatsLastWeekRank")}>
              <span className="font-display text-white">
                {translate(
                  "CommunityRankOf",
                  format(lastWeek.rank.rank, lang),
                  format(lastWeek.rank.rankedCount, lang)
                )}
              </span>
            </SettingsLabel>
          )}
          <SettingsLabel label={translate("SettingsStatsLastWeekProfit")}>
            <Profit value={lastWeek.profit} />
          </SettingsLabel>
        </>
      ) : (
        <p className="rounded-sm bg-neutral-800/50 p-3 text-sm text-neutral-400">
          {translate("CommunityNotPlayedLastWeek")}
        </p>
      )}
    </div>
  );
}
