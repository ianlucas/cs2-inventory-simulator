/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ComponentPropsWithoutRef, useEffect, useRef, useState } from "react";
import { buildViewerSrc, ViewerItemInput } from "~/data/viewer";
import { ViewerApi } from "~/utils/viewer-api";

export function Viewer({
  apiKey,
  embedUrl,
  cdn,
  icon,
  item,
  onApi,
  origin,
  title = "CS2 3D viewer",
  ...props
}: Omit<ComponentPropsWithoutRef<"iframe">, "src"> & {
  apiKey?: string;
  embedUrl?: string;
  cdn?: string;
  icon?: boolean;
  item?: ViewerItemInput;
  onApi: (api: ViewerApi | undefined) => void;
  origin?: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // `?item=` only seeds the initial state; capture the src once so re-renders
  // (or a changed `item` prop) don't reload the iframe. Drive later changes
  // through the api, or remount with a `key`.
  const [src] = useState(() =>
    buildViewerSrc(item, { embedUrl, cdn, key: apiKey, icon })
  );
  const onApiRef = useRef(onApi);
  const originRef = useRef(origin);

  useEffect(() => {
    onApiRef.current = onApi;
  }, [onApi]);

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
