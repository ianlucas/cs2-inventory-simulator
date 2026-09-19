/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ComponentPropsWithoutRef, useEffect, useRef, useState } from "react";
import { buildViewerSrc, ViewerItemInput } from "~/data/viewer";
import { pauseIconGeneration } from "~/utils/item-icon-queue";
import { ViewerApi } from "~/utils/viewer-api";

export function Viewer({
  apiKey,
  capture,
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
  capture?: boolean;
  embedUrl?: string;
  cdn?: string;
  icon?: boolean;
  item?: ViewerItemInput;
  onApi: (api: ViewerApi | undefined) => void;
  origin?: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [src] = useState(() =>
    buildViewerSrc(item, { embedUrl, cdn, key: apiKey, icon, capture })
  );
  const onApiRef = useRef(onApi);
  const originRef = useRef(origin);

  useEffect(() => {
    onApiRef.current = onApi;
  }, [onApi]);

  useEffect(
    () => (capture === true ? undefined : pauseIconGeneration()),
    [capture]
  );

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
