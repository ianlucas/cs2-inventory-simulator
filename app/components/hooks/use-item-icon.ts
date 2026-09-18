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

/**
 * Whether this deployment may generate 3D icons at all.
 *
 * The viewer refuses to hand back a public-tier frame, since it carries a
 * watermark, so a deployment without a partner key can only do this on an
 * origin the viewer trusts built-in. Our own hostname is that origin; a
 * self-hosted copy of this app is not, and gets the flat CDN images.
 */
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

/**
 * Resolves the 3D icon for an item, queueing its generation if this browser has
 * never drawn it.
 *
 * Returns nothing until an icon exists, which is most of the time: the caller
 * shows the flat CDN image meanwhile and swaps when this fills in.
 * `iconRef` goes on the tile so the queue can spend its budget on the items
 * actually on screen.
 *
 * `wanted` is the caller's answer about its own surface; whether the deployment
 * and the user allow it at all is this hook's business, not the tile's.
 */
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
