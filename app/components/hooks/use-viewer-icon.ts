/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem, CS2InventoryItem } from "@ianlucas/cs2-lib";
import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { usePreferences, useRules } from "~/components/app-context";
import { isOurHostname, noop } from "~/shared/misc";
import { getViewerCatalog, ViewerItemInput } from "~/viewer";
import {
  getItemIconKey,
  getViewerIconSlot,
  isIconRedundant,
  isIconRenderable
} from "~/viewer-icon";
import { viewerIcons } from "~/viewer-icon.client";

function getUrlServer(): undefined {
  return undefined;
}

function getItemEditedAt(item: ViewerItemInput): number | undefined {
  if (item instanceof CS2InventoryItem) {
    return item.updatedAt;
  }
  return item instanceof CS2EconomyItem ? undefined : item.updatedAt;
}

export function useViewerIconEnabled(): boolean {
  const { viewer, viewerAttachmentsOnly, viewerKey } = useRules();
  const { prefer2dStickerEditor } = usePreferences();
  return (
    viewer.available &&
    viewerAttachmentsOnly !== true &&
    !prefer2dStickerEditor &&
    (viewerKey.trim() !== "" || isOurHostname())
  );
}

export function useViewerIconPausedWhile(active: boolean): void {
  useEffect(() => (active ? viewerIcons.pause() : undefined), [active]);
}

export function useViewerIcon(
  item: ViewerItemInput,
  {
    enabled,
    foreign
  }: {
    enabled: boolean;
    /** Not from the user's inventory, e.g. on someone's profile. */
    foreign?: boolean;
  }
) {
  const { viewer } = useRules();
  const allowed = useViewerIconEnabled();
  const editedAt = getItemEditedAt(item);
  const key = useMemo(
    () =>
      enabled &&
      allowed &&
      !isIconRedundant(item) &&
      isIconRenderable(getViewerCatalog(viewer), item)
        ? getItemIconKey(item)
        : undefined,
    [enabled, allowed, viewer, item, editedAt]
  );
  const slot =
    key === undefined ? undefined : getViewerIconSlot(item, { foreign });

  useEffect(() => {
    if (slot !== undefined) {
      viewerIcons.request(item, slot);
    }
  }, [key, slot]);

  const url = useSyncExternalStore(
    useCallback(
      (listener: () => void) =>
        slot === undefined ? noop : viewerIcons.subscribe(slot, listener),
      [slot]
    ),
    useCallback(
      () => (slot === undefined ? undefined : viewerIcons.getUrl(slot)),
      [slot]
    ),
    getUrlServer
  );

  const ref = useCallback(
    (element: Element | null) =>
      slot === undefined || element === null
        ? undefined
        : viewerIcons.observe(slot, element),
    [slot]
  );

  return { ref, url };
}
