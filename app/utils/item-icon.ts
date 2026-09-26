/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, CS2EconomyItem } from "@ianlucas/cs2-lib";
import {
  ViewerCatalogLike,
  ViewerItemInput,
  ViewerItemKind,
  isViewerItemSupported,
  stringifyViewerItem
} from "~/data/viewer";

export const ICON_WIDTH = 512;
export const ICON_HEIGHT = 384;

export const ICON_CACHE_VERSION = 1;

const ICON_RENDERABLE_KINDS: ReadonlySet<ViewerItemKind> = new Set([
  "weapon",
  "melee",
  "gloves",
  "keychain"
]);

export function isIconRenderable(
  catalog: ViewerCatalogLike | undefined,
  item: ViewerItemInput
): boolean {
  return isViewerItemSupported(catalog, item, ICON_RENDERABLE_KINDS);
}

export function getItemIconKey(item: ViewerItemInput): string {
  return stringifyViewerItem(item);
}

export function isIconRedundant(item: ViewerItemInput): boolean {
  const economyItem =
    item instanceof CS2EconomyItem ? item : CS2Economy.items.get(item.id);
  return (
    economyItem?.isDefault === true &&
    getItemIconKey(item) === getItemIconKey({ id: item.id })
  );
}
