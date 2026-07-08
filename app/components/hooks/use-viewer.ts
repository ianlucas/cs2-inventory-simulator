/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useState } from "react";
import { useRules } from "~/components/app-context";
import { ViewerItemInput } from "~/data/viewer";
import { ViewerApi } from "~/utils/viewer-api";

/**
 * Owns the viewer api's lifecycle as state, so consumers re-render once it is
 * available. Spread `viewerProps` onto <Viewer/>, then use `api` anywhere:
 *
 *     const { api, viewerProps } = useViewer({ item: inventoryItem });
 *     return (
 *       <>
 *         <Viewer {...viewerProps} className="aspect-video w-full" />
 *         {api && <StickerControls api={api} />}
 *       </>
 *     );
 *
 * The partner key and the viewer's base/asset URLs are injected here from the
 * app rules (`app3dViewerKey`, `viewerEmbedUrl`, `viewerAssetsBaseUrl`), so every
 * consumer stays in sync — callers pass only the item (and an optional origin).
 */
export function useViewer(options?: {
  item?: ViewerItemInput;
  origin?: string;
}) {
  const { app3dViewerKey, viewerAssetsBaseUrl, viewerEmbedUrl } = useRules();
  const [api, setApi] = useState<ViewerApi>();
  return {
    api,
    viewerProps: {
      ...options,
      apiKey: app3dViewerKey || undefined,
      embedUrl: viewerEmbedUrl || undefined,
      cdn: viewerAssetsBaseUrl || undefined,
      onApi: setApi
    }
  };
}
