/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { UnboxingLeague } from "~/models/unboxing-league.server";
import { formatHours, formatRelativeTime } from "~/shared/relative-time";
import { formatSimulatorDollars } from "~/shared/unboxing-league";
import { usePreferences, useTranslate } from "./app-context";
import { InfoIcon } from "./info-icon";
import { TooltipBubble, useTooltip } from "./tooltip";
import { UnboxingLeagueRanking } from "./unboxing-league-ranking";

function CommunityInfo({ text }: { text: string }) {
  const { getReferenceProps, setReference, tooltip } = useTooltip({
    includeFocus: true
  });
  return (
    <>
      <span
        aria-label={text}
        className="inline-flex shrink-0 cursor-help opacity-50 transition-opacity hover:opacity-100"
        ref={setReference}
        tabIndex={0}
        {...getReferenceProps()}
      >
        <InfoIcon className="size-5" />
      </span>
      <TooltipBubble {...tooltip} multiline>
        {text}
      </TooltipBubble>
    </>
  );
}

export function Community({
  budget,
  intervalHours,
  league: { lastWeek, resetsAt, thisWeek },
  now
}: {
  budget: number;
  intervalHours: number;
  league: UnboxingLeague;
  now: number;
}) {
  const translate = useTranslate();
  const { lang } = usePreferences();
  const generatedAt = thisWeek.generatedAt;

  return (
    <div className="m-auto px-4 pt-6 pb-12 lg:w-5xl lg:px-0">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
        <h1 className="font-display flex items-center gap-3 text-3xl font-semibold text-white uppercase">
          <FontAwesomeIcon className="h-7 text-amber-300" icon={faTrophy} />
          {translate("CommunityTitle")}
          <CommunityInfo
            text={translate(
              "CommunityInfo",
              formatSimulatorDollars(budget, lang)
            )}
          />
        </h1>
        <p className="font-display text-sm text-neutral-300">
          {[
            translate(
              "CommunityResetsAt",
              formatRelativeTime(new Date(resetsAt), now, lang)
            ),
            generatedAt !== undefined &&
              translate(
                "CommunityUpdatedAt",
                formatRelativeTime(new Date(generatedAt), now, lang)
              ),
            intervalHours > 0 &&
              translate(
                "CommunityUpdateInterval",
                formatHours(intervalHours, lang)
              )
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <UnboxingLeagueRanking index={0} kind="thisWeek" ranking={thisWeek} />
        <UnboxingLeagueRanking index={1} kind="lastWeek" ranking={lastWeek} />
      </div>
    </div>
  );
}
