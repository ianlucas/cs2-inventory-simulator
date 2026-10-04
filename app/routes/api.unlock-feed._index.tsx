/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { api } from "~/api.server";
import { getUserIdFromRequest } from "~/auth.server";
import { middleware } from "~/middleware.server";
import { appShowUnlockFeed } from "~/models/rule.server";
import { notFound, unauthorized } from "~/responses.server";
import { unlockFeed } from "~/unlock-feed.server";
import type { Route } from "./+types/api.unlock-feed._index";

export const ApiUnlockFeedUrl = "/api/unlock-feed";

// Keeps idle connections from being closed by proxies, e.g. Cloudflare drops
// them after 100 seconds without data.
const HEARTBEAT_INTERVAL_MS = 30_000;

const RECONNECT_DELAY_MS = 5_000;

export const loader = api(async ({ request }: Route.LoaderArgs) => {
  await middleware(request);
  const userId = await getUserIdFromRequest(request);
  if (userId === undefined) {
    throw unauthorized;
  }
  if (!(await appShowUnlockFeed.for(userId).get())) {
    throw notFound;
  }
  const encoder = new TextEncoder();
  let close = () => {};
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (chunk: string) => controller.enqueue(encoder.encode(chunk));
      const unsubscribe = unlockFeed.subscribe((event) =>
        send(`data: ${JSON.stringify(event)}\n\n`)
      );
      const heartbeat = setInterval(
        () => send(": heartbeat\n\n"),
        HEARTBEAT_INTERVAL_MS
      );
      let closed = false;
      close = () => {
        if (closed) {
          return;
        }
        closed = true;
        unsubscribe();
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // Already closed by a cancelled stream.
        }
      };
      request.signal.addEventListener("abort", close);
      send(`retry: ${RECONNECT_DELAY_MS}\n\n`);
    },
    cancel() {
      close();
    }
  });
  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache",
      "Content-Type": "text/event-stream",
      "X-Accel-Buffering": "no"
    }
  });
});
