/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { usePreferences, useRules } from "~/components/app-context";
import { ViewerItemInput } from "~/data/viewer";
import { getItemIconKey, isIconRenderable } from "~/utils/item-icon";
import {
  getIconUrl,
  getIconUrlServer,
  observeIconTile,
  requestIcon,
  subscribeIcon
} from "~/utils/item-icon-queue";
import { isOurHostname } from "~/utils/misc";

const NOOP = () => {};

export function useItemIconEnabled(): boolean {
  const {
    viewerAttachmentsOnly,
    viewerEnabled,
    viewerKey,
    viewerOriginAllowed
  } = useRules();
  const { prefer2dStickerEditor } = usePreferences();
  return (
    viewerEnabled === true &&
    viewerOriginAllowed === true &&
    viewerAttachmentsOnly !== true &&
    !prefer2dStickerEditor &&
    (viewerKey.trim() !== "" || isOurHostname())
  );
}

export function useItemIcon(item: ViewerItemInput, wanted: boolean) {
  const { viewerCatalog } = useRules();
  const enabled = useItemIconEnabled();
  const renderable = wanted && enabled && isIconRenderable(viewerCatalog, item);
  const key = useMemo(
    () => (renderable ? getItemIconKey(item) : undefined),
    [renderable, item]
  );

  const iconUrl = useSyncExternalStore(
    useCallback(
      (listener: () => void) =>
        key === undefined ? NOOP : subscribeIcon(key, listener),
      [key]
    ),
    useCallback(() => (key === undefined ? undefined : getIconUrl(key)), [key]),
    getIconUrlServer
  );

  useEffect(() => {
    if (key !== undefined && iconUrl === undefined) {
      void requestIcon(key, item);
    }
  }, [key, iconUrl]);

  const iconRef = useCallback(
    (element: Element | null) =>
      key === undefined || element === null
        ? undefined
        : observeIconTile(key, element),
    [key]
  );

  return { iconRef, iconUrl };
}
