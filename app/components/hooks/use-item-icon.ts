/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem, CS2InventoryItem } from "@ianlucas/cs2-lib";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore
} from "react";
import { usePreferences, useRules } from "~/components/app-context";
import { ViewerItemInput } from "~/data/viewer";
import {
  getItemIconKey,
  isIconRedundant,
  isIconRenderable
} from "~/utils/item-icon";
import { pauseIconGeneration } from "~/utils/item-icon-generator-role";
import { discardIcon, forgetIcon, requestIcon } from "~/utils/item-icon-queue";
import {
  getIconUrl,
  getIconUrlServer,
  isIconUnavailable,
  isIconUnavailableServer,
  subscribeIcon
} from "~/utils/item-icon-registry";
import { observeIconTile } from "~/utils/item-icon-visibility";
import { isOurHostname } from "~/utils/misc";

const NOOP = () => {};

function getItemEditedAt(item: ViewerItemInput): number | undefined {
  if (item instanceof CS2InventoryItem) {
    return item.updatedAt;
  }
  return item instanceof CS2EconomyItem ? undefined : item.updatedAt;
}

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

export function useIconGenerationPausedWhile(active: boolean): void {
  useEffect(() => (active ? pauseIconGeneration() : undefined), [active]);
}

export function useItemIcon(item: ViewerItemInput, wanted: boolean) {
  const { viewerCatalog } = useRules();
  const enabled = useItemIconEnabled();
  const editedAt = getItemEditedAt(item);
  const redundantKey = useMemo(
    () => (isIconRedundant(item) ? getItemIconKey(item) : undefined),
    [item, editedAt]
  );
  const renderable =
    wanted &&
    enabled &&
    redundantKey === undefined &&
    isIconRenderable(viewerCatalog, item);
  const key = useMemo(
    () => (renderable ? getItemIconKey(item) : undefined),
    [renderable, item, editedAt]
  );

  useEffect(() => {
    if (redundantKey !== undefined) {
      void discardIcon(redundantKey);
    }
  }, [redundantKey]);

  const subscribe = useCallback(
    (listener: () => void) =>
      key === undefined ? NOOP : subscribeIcon(key, listener),
    [key]
  );

  const iconUrl = useSyncExternalStore(
    subscribe,
    useCallback(() => (key === undefined ? undefined : getIconUrl(key)), [key]),
    getIconUrlServer
  );

  const unavailable = useSyncExternalStore(
    subscribe,
    useCallback(() => key !== undefined && isIconUnavailable(key), [key]),
    isIconUnavailableServer
  );

  const lastRenderedIconUrl = useRef<string | undefined>(undefined);
  if (iconUrl !== undefined) {
    lastRenderedIconUrl.current = iconUrl;
  } else if (key === undefined || unavailable) {
    lastRenderedIconUrl.current = undefined;
  }

  const lastRequestedKey = useRef<string | undefined>(undefined);
  const supersededKey = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (key === undefined) {
      return;
    }
    const previous = lastRequestedKey.current;
    const regeneratesEditedItem = previous !== undefined && previous !== key;
    if (regeneratesEditedItem) {
      supersededKey.current = previous;
    }
    lastRequestedKey.current = key;
    if (iconUrl === undefined) {
      void requestIcon(key, item, { priority: regeneratesEditedItem });
      return;
    }
    const superseded = supersededKey.current;
    if (superseded !== undefined) {
      supersededKey.current = undefined;
      forgetIcon(superseded);
    }
  }, [key, iconUrl]);

  const iconRef = useCallback(
    (element: Element | null) =>
      key === undefined || element === null
        ? undefined
        : observeIconTile(key, element),
    [key]
  );

  return { iconRef, iconUrl: iconUrl ?? lastRenderedIconUrl.current };
}
