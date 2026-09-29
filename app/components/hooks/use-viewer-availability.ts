/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useCallback, useSyncExternalStore } from "react";
import { usePreferences, useRules } from "~/components/app-context";
import { ViewerItemInput, ViewerItemKind } from "~/viewer";
import { viewerClientAvailability } from "~/viewer-client-availability";

export function useViewerAvailability(
  item?: ViewerItemInput,
  {
    attachment = false,
    kinds
  }: { attachment?: boolean; kinds?: ReadonlySet<ViewerItemKind> } = {}
) {
  const { viewer, viewerAttachmentsOnly } = useRules();
  const { prefer2dStickerEditor } = usePreferences();
  useSyncExternalStore(
    viewerClientAvailability.subscribe,
    viewerClientAvailability.getSnapshot,
    viewerClientAvailability.getSnapshot
  );
  const wanted = attachment
    ? !prefer2dStickerEditor
    : viewerAttachmentsOnly !== true;
  const canUse3d =
    wanted &&
    viewerClientAvailability.isAvailable(viewer) &&
    (item === undefined ||
      viewerClientAvailability.isItemSupported(viewer, item, kinds));
  const isIdSupported = useCallback(
    (id: number) => viewerClientAvailability.isIdSupported(viewer, id),
    [viewer]
  );
  return { canUse3d, isIdSupported };
}
