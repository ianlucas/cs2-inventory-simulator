/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ComponentPropsWithoutRef, useEffect, useRef, useState } from "react";
import { useViewerIconPausedWhile } from "~/components/hooks/use-viewer-icon";
import { buildViewerSrc, ViewerItemInput } from "~/viewer";
import { ViewerApi } from "~/viewer-api.client";

export function Viewer({
  apiKey,
  capture,
  embedUrl,
  cdn,
  icon,
  item,
  onApi,
  origin,
  pauseIcons = capture !== true,
  title = "CS2 3D viewer",
  zoom,
  ...props
}: Omit<ComponentPropsWithoutRef<"iframe">, "src"> & {
  apiKey?: string;
  capture?: boolean;
  embedUrl?: string;
  cdn?: string;
  icon?: boolean;
  item?: ViewerItemInput;
  onApi: (api: ViewerApi | undefined) => void;
  origin?: string;
  pauseIcons?: boolean;
  zoom?: number;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // `?item=` only seeds the initial state; capture the src once so re-renders
  // (or a changed `item` prop) don't reload the iframe. Drive later changes
  // through the api, or remount with a `key`.
  const [src] = useState(() =>
    buildViewerSrc(item, { embedUrl, cdn, key: apiKey, icon, capture, zoom })
  );
  const onApiRef = useRef(onApi);
  const originRef = useRef(origin);

  useEffect(() => {
    onApiRef.current = onApi;
  }, [onApi]);

  useViewerIconPausedWhile(pauseIcons);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe === null) {
      return;
    }
    const api = new ViewerApi(iframe, { origin: originRef.current });
    onApiRef.current(api);
    return () => {
      api.destroy();
      onApiRef.current(undefined);
    };
  }, []);

  return <iframe ref={iframeRef} src={src} title={title} {...props} />;
}
