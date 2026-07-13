/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2BaseInventoryItem,
  CS2Economy,
  CS2EconomyItem,
  CS2InventoryItem
} from "@ianlucas/cs2-lib";
// Type-only so this module never depends on viewer-api at runtime (it is also
// imported server-side).
import type { ViewerItem } from "~/utils/viewer-api";

export const DEFAULT_VIEWER_EMBED_URL = "https://3d.cstrike.app/view";

export type ViewerItemInput =
  CS2EconomyItem | CS2InventoryItem | CS2BaseInventoryItem;

// The viewer's `/api/catalog` manifest: supported(id) = id <= maxId && id not
// inside a [lo, hi] hole. Carries no kind information (non-renderable kinds sit
// interleaved as "present" ids), so it only answers for ids the host already
// classified as renderable via isViewerRenderableKind.
export interface ViewerCatalog {
  maxId: number;
  holes: [number, number][];
}

// Loose on `holes` because the loader-serialized form (SerializeFrom) may widen
// the tuples to `number[]`.
export type ViewerCatalogLike = {
  maxId: number;
  holes: readonly (readonly number[])[];
};

export function isViewerIdSupported(
  catalog: ViewerCatalogLike | undefined,
  id: number
): boolean {
  if (catalog === undefined || id > catalog.maxId) {
    return false;
  }
  for (const [lo, hi] of catalog.holes) {
    if (id >= lo && id <= hi) {
      return false;
    }
  }
  return true;
}

export function getViewerItemIds(item: ViewerItemInput): number[] {
  const viewerItem = toViewerItem(item);
  const ids = [viewerItem.id];
  if (viewerItem.stickers !== undefined) {
    for (const sticker of Object.values(viewerItem.stickers)) {
      if (sticker !== undefined) {
        ids.push(sticker.id);
      }
    }
  }
  return ids;
}

function isViewerRenderableKind(item: ViewerItemInput): boolean {
  const economyItem =
    item instanceof CS2EconomyItem ? item : CS2Economy.items.get(item.id);
  return (
    economyItem !== undefined &&
    (economyItem.isWeapon() || economyItem.isMelee() || economyItem.isSticker())
  );
}

export function isViewerItemSupported(
  catalog: ViewerCatalogLike | undefined,
  item: ViewerItemInput
): boolean {
  return (
    isViewerRenderableKind(item) &&
    getViewerItemIds(item).every((id) => isViewerIdSupported(catalog, id))
  );
}

export function toViewerItem(item: ViewerItemInput): ViewerItem {
  if (item instanceof CS2InventoryItem) {
    return toViewerItem(item.asBase());
  }
  if (item instanceof CS2EconomyItem) {
    return { id: item.id };
  }
  const viewerItem: ViewerItem = { id: item.id };
  if (item.seed !== undefined) viewerItem.seed = item.seed;
  if (item.wear !== undefined) viewerItem.wear = item.wear;
  if (item.stickers !== undefined) viewerItem.stickers = item.stickers;
  if (item.statTrak !== undefined) viewerItem.statTrak = item.statTrak;
  if (item.nameTag !== undefined) viewerItem.nameTag = item.nameTag;
  return viewerItem;
}

export function buildViewerSrc(
  item?: ViewerItemInput,
  options?: { embedUrl?: string; cdn?: string; key?: string; icon?: boolean }
): string {
  const url = new URL(options?.embedUrl ?? DEFAULT_VIEWER_EMBED_URL);
  url.searchParams.set("halfRotation", "1");
  if (item !== undefined) {
    url.searchParams.set("item", JSON.stringify(toViewerItem(item)));
  }
  if (options?.key !== undefined) {
    url.searchParams.set("key", options.key);
  }
  if (options?.cdn !== undefined) {
    url.searchParams.set("cdn", options.cdn);
  }
  if (options?.icon === true) {
    url.searchParams.set("icon", "");
  }
  return url.toString();
}
