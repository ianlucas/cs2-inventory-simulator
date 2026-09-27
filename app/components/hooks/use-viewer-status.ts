/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";
import { noop } from "~/utils/misc";
import { ViewerApi } from "~/utils/viewer-api";
import { viewerClientAvailability } from "~/utils/viewer-availability";

const VIEWER_READY_TIMEOUT_MS = 6_000;

type ViewerStatus = "pending" | "ready" | "unavailable";

// Reports this viewer's failures to viewerClientAvailability, which gates
// viewers mounted afterwards; the host itself falls back on `isUnavailable`.
// Neither flag is set while the viewer is still loading.
export function useViewerStatus(api: ViewerApi | undefined) {
  const [status, setStatus] = useState<ViewerStatus>("pending");

  useEffect(() => {
    if (api === undefined) {
      return;
    }
    setStatus("pending");
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      viewerClientAvailability.reportTimeout();
      setStatus("unavailable");
    }, VIEWER_READY_TIMEOUT_MS);
    const offRateLimited = api.on("rateLimited", ({ retryAfterMs, scope }) => {
      // Per-user ("ip") limits recover in place via the viewer's own retry;
      // instance-wide ones persist, so fall back even after "ready".
      if (scope === "ip") {
        return;
      }
      viewerClientAvailability.reportRateLimited(retryAfterMs);
      settled = true;
      clearTimeout(timer);
      setStatus("unavailable");
    });
    const offUnsupported = api.on("unsupported", ({ reason }) => {
      viewerClientAvailability.reportUnsupported(api.item, reason);
      settled = true;
      clearTimeout(timer);
      setStatus("unavailable");
    });
    api
      .whenReady()
      .then(() => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        setStatus("ready");
      })
      .catch(noop);
    return () => {
      clearTimeout(timer);
      offRateLimited();
      offUnsupported();
    };
  }, [api]);

  return {
    isReady: status === "ready",
    isUnavailable: status === "unavailable"
  };
}
