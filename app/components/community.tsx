/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { loader } from "~/routes/community._index";
import type { SerializeFrom } from "~/shared/misc";
import { formatSimulatorDollars } from "~/shared/number";
import { formatRelativeTime } from "~/shared/relative-time";
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
        className="inline-flex shrink-0 opacity-50 transition-opacity hover:opacity-100"
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
  isViewerPrivate,
  league: { lastWeek, resetsAt, thisWeek },
  now
}: SerializeFrom<typeof loader>) {
  const translate = useTranslate();
  const { lang } = usePreferences();
  const generatedAt = thisWeek.generatedAt;

  return (
    <div className="m-auto px-4 pt-6 pb-12 lg:w-5xl lg:px-0">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
        <h1 className="font-display flex items-center gap-3 text-3xl font-semibold text-white">
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
              )
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <UnboxingLeagueRanking
          isViewerPrivate={isViewerPrivate}
          kind="thisWeek"
          order={0}
          ranking={thisWeek}
        />
        <UnboxingLeagueRanking
          isViewerPrivate={isViewerPrivate}
          kind="lastWeek"
          order={1}
          ranking={lastWeek}
        />
      </div>
    </div>
  );
}
