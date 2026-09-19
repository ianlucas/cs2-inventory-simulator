/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, CS2EconomyItem } from "@ianlucas/cs2-lib";
import {
  ViewerCatalogLike,
  ViewerItemInput,
  isViewerItemSupported,
  toViewerItem
} from "~/data/viewer";

export const ICON_WIDTH = 512;
export const ICON_HEIGHT = 384;

export const ICON_CACHE_VERSION = 1;

export function isIconRenderable(
  catalog: ViewerCatalogLike | undefined,
  item: ViewerItemInput
): boolean {
  const economyItem =
    item instanceof CS2EconomyItem ? item : CS2Economy.items.get(item.id);
  if (economyItem === undefined) {
    return false;
  }
  return (
    (economyItem.isWeapon() ||
      economyItem.isMelee() ||
      economyItem.isGloves() ||
      economyItem.isKeychain()) &&
    isViewerItemSupported(catalog, item)
  );
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => entry !== undefined)
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`);
  return `{${entries.join(",")}}`;
}

export function getItemIconKey(item: ViewerItemInput): string {
  return stableStringify(toViewerItem(item));
}
