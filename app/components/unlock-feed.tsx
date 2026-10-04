/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy } from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { useEffect, useLayoutEffect, useRef } from "react";
import {
  usePreferences,
  useRules,
  useTranslate,
  useUser
} from "~/components/app-context";
import { useNameItemString } from "~/components/hooks/use-name-item";
import {
  UNLOCK_FEED_LINE_FADE_OUT_MS,
  UNLOCK_FEED_LINE_LIFETIME_MS,
  UnlockFeedLine as UnlockFeedLineData,
  useUnlockFeed
} from "~/components/hooks/use-unlock-feed";
import { createFakeInventoryItem } from "~/shared/inventory";

export function UnlockFeed() {
  const user = useUser();
  const { appShowUnlockFeed } = useRules();
  const { hideUnlockFeed } = usePreferences();
  return user !== undefined && appShowUnlockFeed && !hideUnlockFeed ? (
    <UnlockFeedLines />
  ) : null;
}

function UnlockFeedLines() {
  const { expire, fit, lines, remove } = useUnlockFeed();
  const feedRef = useRef<HTMLDivElement>(null);

  // How many text lines a message wraps into is only known after layout.
  useLayoutEffect(() => {
    const lineCounts = new Map<number, number>();
    for (const paragraph of feedRef.current?.querySelectorAll("p") ?? []) {
      const lineHeight = parseFloat(getComputedStyle(paragraph).lineHeight);
      lineCounts.set(
        Number(paragraph.dataset.id),
        Math.round(paragraph.offsetHeight / lineHeight)
      );
    }
    fit(lineCounts);
  }, [lines]);

  return (
    <div
      ref={feedRef}
      className="font-display pointer-events-none fixed bottom-6 left-6 z-10 flex max-w-[calc(100vw-3rem)] flex-col text-base/6.5 text-white drop-shadow-[0_0_3px_rgba(0,0,0,1)] sm:bottom-16 sm:left-16 sm:max-w-105"
    >
      {lines.map((line) => (
        <UnlockFeedLine
          key={line.id}
          line={line}
          onExpire={expire}
          onRemove={remove}
        />
      ))}
    </div>
  );
}

function UnlockFeedLine({
  line: { event, id, leaving },
  onExpire,
  onRemove
}: {
  line: UnlockFeedLineData;
  onExpire: (id: number) => void;
  onRemove: (id: number) => void;
}) {
  const translate = useTranslate();
  const nameItemString = useNameItemString();

  useEffect(() => {
    const timeout = leaving
      ? setTimeout(() => onRemove(id), UNLOCK_FEED_LINE_FADE_OUT_MS)
      : setTimeout(() => onExpire(id), UNLOCK_FEED_LINE_LIFETIME_MS);
    return () => clearTimeout(timeout);
  }, [leaving]);

  const item = CS2Economy.getById(event.itemId);
  const itemName = nameItemString(
    event.statTrak ? createFakeInventoryItem(item, { statTrak: 0 }) : item
  );
  // Placeholders are passed through as-is so the template can be split into
  // elements, whatever order the language puts them in.
  const template = translate("UnlockFeedFoundInCrate", "{1}", "{2}");

  return (
    <div
      className={clsx(
        "grid",
        leaving
          ? "animate-unlock-feed-line-leave"
          : "animate-unlock-feed-line-enter"
      )}
    >
      <div className="min-h-0">
        <p className="wrap-break-word" data-id={id}>
          {template.split(/(\{[12]\})/).map((part, index) =>
            part === "{1}" ? (
              <a
                className={clsx(
                  "text-[#99ccff] hover:underline",
                  !leaving && "pointer-events-auto"
                )}
                href={`/profiles/${event.userId}`}
                key={index}
                rel="noopener"
                target="_blank"
              >
                {event.userName}
              </a>
            ) : part === "{2}" ? (
              <span key={index} style={{ color: item.rarityColor }}>
                {itemName}
              </span>
            ) : (
              part
            )
          )}
        </p>
      </div>
    </div>
  );
}
