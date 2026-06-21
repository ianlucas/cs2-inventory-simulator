/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useState } from "react";
import { Cs2ViewerItemInput } from "~/data/cs2-viewer";
import { Cs2ViewerApi } from "~/utils/cs2-viewer-api";

/**
 * Owns the viewer api's lifecycle as state, so consumers re-render once it is
 * available. Spread `viewerProps` onto <Cs2Viewer/>, then use `api` anywhere:
 *
 *     const { api, viewerProps } = useCs2Viewer({ item: inventoryItem });
 *     return (
 *       <>
 *         <Cs2Viewer {...viewerProps} className="aspect-video w-full" />
 *         {api && <StickerControls api={api} />}
 *       </>
 *     );
 */
export function useCs2Viewer(options?: {
  apiKey?: string;
  baseUrl?: string;
  item?: Cs2ViewerItemInput;
  origin?: string;
}) {
  const [api, setApi] = useState<Cs2ViewerApi>();
  return {
    api,
    viewerProps: { ...options, onApi: setApi }
  };
}
