/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";
import { ViewerApi } from "~/utils/viewer-api";
import {
  markViewerRateLimited,
  markViewerUnsupported
} from "./use-viewer-availability";

const VIEWER_READY_TIMEOUT_MS = 6000;

export type ViewerStatus = "pending" | "ready" | "unavailable";

export function useViewerStatus(api: ViewerApi | undefined): ViewerStatus {
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
      markViewerUnsupported("network");
      setStatus("unavailable");
    }, VIEWER_READY_TIMEOUT_MS);
    const offRateLimited = api.on("rateLimited", ({ retryAfterMs, scope }) => {
      // Per-user ("ip") limits recover in place via the viewer's own retry;
      // instance-wide ones persist, so fall back even after "ready".
      if (scope === "ip") {
        return;
      }
      markViewerRateLimited(retryAfterMs);
      settled = true;
      clearTimeout(timer);
      setStatus("unavailable");
    });
    const offUnsupported = api.on("unsupported", ({ reason }) => {
      markViewerUnsupported(reason);
      settled = true;
      clearTimeout(timer);
      setStatus("unavailable");
    });
    void api.whenReady().then(() => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      setStatus("ready");
    });
    return () => {
      clearTimeout(timer);
      offRateLimited();
      offUnsupported();
    };
  }, [api]);

  return status;
}
