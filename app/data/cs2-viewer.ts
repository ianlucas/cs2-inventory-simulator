/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2BaseInventoryItem,
  CS2EconomyItem,
  CS2InventoryItem
} from "@ianlucas/cs2-lib";
// Type-only (erased) so this module never depends on cs2-viewer-api at runtime.
import type { ViewerItem } from "~/utils/cs2-viewer-api";

// The 3D viewer isn't deployed yet; point at its local dev server for now.
export const CS2_VIEWER_BASE_URL = "http://localhost:5173/view";

// Anything we can turn into a viewer item: an economy entry, a live inventory
// item, or the plain serialized shape.
export type Cs2ViewerItemInput =
  | CS2EconomyItem
  | CS2InventoryItem
  | CS2BaseInventoryItem;

// Narrow any accepted item into the subset the viewer reads (id/seed/wear/
// stickers), dropping undefined fields so the viewer overlays its own defaults.
export function toViewerItem(item: Cs2ViewerItemInput): ViewerItem {
  if (item instanceof CS2InventoryItem) {
    return toViewerItem(item.asBase());
  }
  if (item instanceof CS2EconomyItem) {
    return { id: item.id };
  }
  const viewerItem: ViewerItem = { id: item.id };
  if (item.seed !== undefined) viewerItem.seed = item.seed;
  /** @todo Wear is not supported for now. */
  // if (item.wear !== undefined) viewerItem.wear = item.wear;
  if (item.stickers !== undefined) viewerItem.stickers = item.stickers;
  return viewerItem;
}

// Build the iframe `src`: the viewer URL with the initial state encoded as the
// `?item=` JSON param (the embed API takes over after load). `key`/`icon` map to
// the viewer's other query params.
export function buildViewerSrc(
  item?: Cs2ViewerItemInput,
  options?: { baseUrl?: string; key?: string; icon?: boolean }
): string {
  const url = new URL(options?.baseUrl ?? CS2_VIEWER_BASE_URL);
  if (item !== undefined) {
    url.searchParams.set("item", JSON.stringify(toViewerItem(item)));
  }
  if (options?.key !== undefined) {
    url.searchParams.set("key", options.key);
  }
  if (options?.icon === true) {
    url.searchParams.set("icon", "");
  }
  return url.toString();
}
