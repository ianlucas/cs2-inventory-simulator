/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useState } from "react";
import { useRules } from "~/components/app-context";
import { ViewerItemInput } from "~/viewer";
import { ViewerApi } from "~/viewer-api.client";

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
