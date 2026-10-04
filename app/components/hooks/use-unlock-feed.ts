/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy } from "@ianlucas/cs2-lib";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { ApiUnlockFeedUrl } from "~/routes/api.unlock-feed._index";
import type { UnlockFeedEvent } from "~/unlock-feed";

// Text lines, so a wrapped message counts once per line it takes.
export const UNLOCK_FEED_MAX_LINES = 7;

export const UNLOCK_FEED_LINE_LIFETIME_MS = 12_000;

export const UNLOCK_FEED_LINE_FADE_OUT_MS = 500;

// EventSource gives up on HTTP errors, e.g. a proxy error while the server
// restarts, so those are retried by hand.
const RECONNECT_DELAY_MS = 30_000;

export interface UnlockFeedLine {
  event: UnlockFeedEvent;
  id: number;
  leaving: boolean;
}

export type UnlockFeedAction =
  | { type: "push"; event: UnlockFeedEvent; id: number }
  | { type: "expire"; id: number }
  | { type: "fit"; lineCounts: Map<number, number> }
  | { type: "remove"; id: number };

export function unlockFeedReducer(
  lines: UnlockFeedLine[],
  action: UnlockFeedAction
): UnlockFeedLine[] {
  switch (action.type) {
    case "push":
      return [...lines, { event: action.event, id: action.id, leaving: false }];
    case "expire":
      return lines.map((line) =>
        line.id === action.id && !line.leaving
          ? { ...line, leaving: true }
          : line
      );
    case "fit": {
      // Counts from the newest line up, so the oldest lines are the ones that
      // fade out instead of vanishing.
      let total = 0;
      let changed = false;
      const fitted = [...lines].reverse().map((line) => {
        if (line.leaving) {
          return line;
        }
        const isNewest = total === 0;
        total += action.lineCounts.get(line.id) ?? 1;
        // The newest line always stays, however long it is.
        if (isNewest || total <= UNLOCK_FEED_MAX_LINES) {
          return line;
        }
        changed = true;
        return { ...line, leaving: true };
      });
      // Same state when nothing changed, so fitting after a render can't loop.
      return changed ? fitted.reverse() : lines;
    }
    case "remove":
      return lines.filter((line) => line.id !== action.id);
  }
}

export function useUnlockFeed() {
  const [lines, dispatch] = useReducer(unlockFeedReducer, []);
  const nextIdRef = useRef(0);

  useEffect(() => {
    let source: EventSource | undefined;
    let reconnectTimeout: ReturnType<typeof setTimeout> | undefined;

    function connect() {
      if (source !== undefined || document.visibilityState !== "visible") {
        return;
      }
      source = new EventSource(ApiUnlockFeedUrl);
      source.onmessage = ({ data }) => {
        const event = JSON.parse(data) as UnlockFeedEvent;
        // The server may be on a newer economy than this client.
        if (CS2Economy.items.has(event.itemId)) {
          dispatch({ type: "push", event, id: nextIdRef.current++ });
        }
      };
      source.onerror = () => {
        if (source?.readyState === EventSource.CLOSED) {
          disconnect();
          reconnectTimeout = setTimeout(connect, RECONNECT_DELAY_MS);
        }
      };
    }

    function disconnect() {
      clearTimeout(reconnectTimeout);
      source?.close();
      source = undefined;
    }

    // Drops are live only, so hidden tabs don't need a connection.
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        connect();
      } else {
        disconnect();
      }
    }

    connect();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      disconnect();
    };
  }, []);

  const expire = useCallback(
    (id: number) => dispatch({ type: "expire", id }),
    []
  );
  const fit = useCallback(
    (lineCounts: Map<number, number>) => dispatch({ type: "fit", lineCounts }),
    []
  );
  const remove = useCallback(
    (id: number) => dispatch({ type: "remove", id }),
    []
  );

  return { expire, fit, lines, remove };
}
