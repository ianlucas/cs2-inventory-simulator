/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useState } from "react";
import { useRules } from "~/components/app-context";
import { ViewerItemInput } from "~/data/viewer";
import { ViewerApi } from "~/utils/viewer-api";

export function useViewer(options?: {
  item?: ViewerItemInput;
  origin?: string;
}) {
  const { viewerKey, viewerAssetsBaseUrl, viewerEmbedUrl } = useRules();
  const [api, setApi] = useState<ViewerApi>();
  return {
    api,
    viewerProps: {
      ...options,
      apiKey: viewerKey || undefined,
      embedUrl: viewerEmbedUrl || undefined,
      cdn: viewerAssetsBaseUrl || undefined,
      onApi: setApi
    }
  };
}
