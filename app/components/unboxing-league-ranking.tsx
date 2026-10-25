/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  faCaretDown,
  faCaretUp,
  faFlagCheckered,
  faTrophy
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CS2Economy } from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { getSoundProps } from "~/interface-sounds";
import type { loader } from "~/routes/community._index";
import type { SerializeFrom } from "~/shared/misc";
import { format, formatCompact, formatSimulatorDollars } from "~/shared/number";
import { usePreferences, useTranslate } from "./app-context";
import { useNameItemString } from "./hooks/use-name-item";
import { ItemImage } from "./item-image";

type RankingData = SerializeFrom<typeof loader>["league"]["thisWeek"];

type RowData = RankingData["rows"][number];

const ROW_ANIMATION_STAGGER_MS = 60;

const RANKING_KINDS = {
  lastWeek: {
    accent: "before:bg-sky-400",
    emptyViewer: "CommunityNotPlayedLastWeek",
    icon: faTrophy,
    iconColor: "text-sky-300",
    title: "CommunityLastWeek"
  },
  thisWeek: {
    accent: "before:bg-amber-400",
    emptyViewer: "CommunityNotRanked",
    icon: faFlagCheckered,
    iconColor: "text-amber-300",
    title: "CommunityThisWeek"
  }
} as const;

const MEDAL_STYLES: Record<number, string> = {
  1: "from-yellow-100 via-amber-300 to-amber-600 text-amber-950",
  2: "from-white via-zinc-300 to-zinc-500 text-zinc-900",
  3: "from-orange-200 via-orange-400 to-orange-800 text-orange-950"
};

function RankBadge({ rank }: { rank: number }) {
  const { lang } = usePreferences();
  const medal = MEDAL_STYLES[rank];
  return medal !== undefined ? (
    <span
      className={clsx(
        "font-display flex size-8 shrink-0 items-center justify-center bg-linear-to-b font-semibold [clip-path:polygon(50%_0,100%_25%,100%_75%,50%_100%,0_75%,0_25%)]",
        medal
      )}
    >
      {rank}
    </span>
  ) : (
    <span className="font-display min-w-8 shrink-0 text-center text-sm text-neutral-400 tabular-nums">
      {formatCompact(rank, lang)}
    </span>
  );
}

function RankMovement({
  previousRank,
  rank
}: {
  previousRank: number | null;
  rank: number;
}) {
  const translate = useTranslate();
  const { lang } = usePreferences();
  const delta = previousRank === null ? undefined : previousRank - rank;
  return (
    <span className="font-display flex w-12 shrink-0 items-center justify-center text-xs font-semibold tabular-nums">
      {delta === undefined ? (
        <span className="text-sky-300">{translate("CommunityNew")}</span>
      ) : delta > 0 ? (
        <span className="flex items-center gap-0.5 text-green-400">
          <FontAwesomeIcon className="h-3" icon={faCaretUp} />
          {formatCompact(delta, lang)}
        </span>
      ) : delta < 0 ? (
        <span className="flex items-center gap-0.5 text-red-400">
          <FontAwesomeIcon className="h-3" icon={faCaretDown} />
          {formatCompact(-delta, lang)}
        </span>
      ) : (
        <span className="text-neutral-500">–</span>
      )}
    </span>
  );
}

export function Profit({
  className,
  value
}: {
  className?: string;
  value: number;
}) {
  const { lang } = usePreferences();
  return (
    <span
      className={clsx(
        "font-display tabular-nums",
        value < 0 ? "text-red-400" : "text-emerald-400",
        className
      )}
    >
      {formatSimulatorDollars(value, lang, true)}
    </span>
  );
}

export function BestDrop({
  drop,
  payoutClassName
}: {
  drop: RowData["bestDrop"];
  payoutClassName?: string;
}) {
  const translate = useTranslate();
  const nameItemString = useNameItemString();
  const { lang } = usePreferences();
  const item = CS2Economy.items.get(drop.itemId);
  const name =
    item !== undefined
      ? [
          drop.statTrak && translate("InventoryItemStatTrak"),
          nameItemString(item)
        ]
          .filter(Boolean)
          .join(" ")
      : undefined;
  return (
    <span
      className="flex shrink-0 items-center gap-2.5"
      title={
        name !== undefined
          ? `${translate("CommunityBestDrop")}: ${name}`
          : translate("CommunityBestDrop")
      }
    >
      {item !== undefined && (
        <span
          className="flex rounded-xs border border-b-2 border-white/15 bg-black/30 px-1"
          style={{ borderBottomColor: item.rarityColor }}
        >
          <ItemImage className="h-7" item={item} lazy wear={drop.wear} />
        </span>
      )}
      <span
        className={clsx(
          "font-display text-amber-200 tabular-nums",
          payoutClassName
        )}
      >
        {formatSimulatorDollars(drop.payout, lang)}
      </span>
    </span>
  );
}

function RankingRow({
  animationIndex,
  hasMovement,
  isViewer,
  rankedCount,
  row
}: {
  animationIndex: number;
  hasMovement: boolean;
  isViewer: boolean;
  rankedCount?: number;
  row: RowData;
}) {
  const translate = useTranslate();
  const { lang } = usePreferences();
  return (
    <li
      className="motion-safe:animate-community-row-in"
      style={{
        animationDelay: `${animationIndex * ROW_ANIMATION_STAGGER_MS}ms`
      }}
    >
      <a
        className={clsx(
          "flex items-center gap-3 px-4 py-2 transition-colors hover:bg-white/10",
          isViewer &&
            "bg-orange-400/10 shadow-[inset_3px_0_0_var(--color-orange-400),inset_0_0_24px_color-mix(in_oklab,var(--color-orange-400)_15%,transparent)]"
        )}
        href={`/profiles/${row.userId}`}
        rel="noopener noreferrer"
        target="_blank"
        {...getSoundProps({ hover: "submenu_rollover" })}
      >
        <RankBadge rank={row.rank} />
        {hasMovement && (
          <RankMovement previousRank={row.previousRank} rank={row.rank} />
        )}
        <img
          alt={row.name}
          className="size-8 shrink-0 rounded-sm"
          draggable={false}
          src={row.avatar}
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm text-white">{row.name}</span>
            {isViewer && (
              <span className="font-display shrink-0 rounded-xs bg-orange-400 px-1 text-xs font-semibold text-black uppercase">
                {translate("CommunityYou")}
              </span>
            )}
          </span>
          {rankedCount !== undefined && (
            <span className="block truncate text-xs text-neutral-400">
              {translate(
                "CommunityRankOf",
                format(row.rank, lang),
                format(rankedCount, lang)
              )}
            </span>
          )}
        </span>
        <BestDrop drop={row.bestDrop} payoutClassName="w-16 text-xs" />
        <Profit
          className="w-20 shrink-0 text-right text-sm"
          value={row.profit}
        />
      </a>
    </li>
  );
}

export function UnboxingLeagueRanking({
  isViewerPrivate,
  kind,
  order,
  ranking: { hasMovement, rankedCount, rows, viewer }
}: {
  isViewerPrivate: boolean;
  kind: keyof typeof RANKING_KINDS;
  order: number;
  ranking: RankingData;
}) {
  const translate = useTranslate();
  const { accent, emptyViewer, icon, iconColor, title } = RANKING_KINDS[kind];
  const showMovement = kind === "thisWeek" && hasMovement;
  const isViewerOnTop =
    viewer != null && rows.some((row) => row.userId === viewer.userId);
  // Rankings slide in one after another, as do their rows.
  const firstAnimationIndex = order * (rows.length + 1);

  return (
    <section
      className={clsx(
        "relative overflow-hidden rounded-sm border border-white/10 bg-neutral-900/70 shadow-lg backdrop-blur-sm before:absolute before:inset-x-0 before:top-0 before:h-0.5",
        accent
      )}
    >
      <header className="flex items-center gap-3 border-b border-white/10 bg-linear-to-r from-white/10 to-transparent px-4 py-3">
        <FontAwesomeIcon
          className={clsx("h-6 shrink-0", iconColor)}
          icon={icon}
        />
        <h2 className="font-display min-w-0 flex-1 truncate text-xl font-semibold text-white">
          {translate(title)}
        </h2>
      </header>
      {rows.length > 0 ? (
        <ol className="py-1">
          {rows.map((row, rowIndex) => (
            <RankingRow
              animationIndex={firstAnimationIndex + rowIndex}
              hasMovement={showMovement}
              isViewer={row.userId === viewer?.userId}
              key={row.userId}
              row={row}
            />
          ))}
          {viewer != null && !isViewerOnTop && (
            <RankingRow
              animationIndex={firstAnimationIndex + rows.length}
              hasMovement={showMovement}
              isViewer
              rankedCount={rankedCount}
              row={viewer}
            />
          )}
        </ol>
      ) : (
        <p className="px-4 py-6 text-center text-neutral-400">
          {translate("CommunityEmpty")}
        </p>
      )}
      {viewer === null && (
        <p className="border-t border-white/10 px-4 py-3 text-center text-sm text-neutral-400">
          {translate(isViewerPrivate ? "CommunityProfilePrivate" : emptyViewer)}
        </p>
      )}
    </section>
  );
}
