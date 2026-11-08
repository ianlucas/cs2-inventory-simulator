/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useCallback, useSyncExternalStore } from "react";
import { usePreferences, useRules } from "~/components/app-context";
import { ViewerItemInput, ViewerItemKind } from "~/viewer";
import { viewerClientAvailability } from "~/viewer-client-availability";
import { useFreeze } from "./use-freeze";

interface ViewerAvailabilityOptions {
  attachment?: boolean;
  kinds?: ReadonlySet<ViewerItemKind>;
}

export function useViewerAvailability(
  item?: ViewerItemInput,
  { attachment = false, kinds }: ViewerAvailabilityOptions = {}
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

export function useOpensIn3d(
  item: ViewerItemInput,
  {
    attachmentIds = [],
    ...options
  }: ViewerAvailabilityOptions & { attachmentIds?: readonly number[] } = {}
) {
  const { canUse3d, isIdSupported } = useViewerAvailability(item, options);
  return useFreeze(() => canUse3d && attachmentIds.every(isIdSupported));
}
