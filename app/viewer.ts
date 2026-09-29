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
import type { ViewerItem } from "~/viewer-api.client";

export const DEFAULT_VIEWER_EMBED_URL = "https://3d.cstrike.app/view";

export type ViewerItemInput =
  CS2EconomyItem | CS2InventoryItem | CS2BaseInventoryItem;

export type ViewerItemKind =
  | "weapon"
  | "melee"
  | "gloves"
  | "sticker"
  | "stickerSlab"
  | "keychain"
  | "agent";

const VIEWER_RENDERABLE_KINDS: ReadonlySet<ViewerItemKind> = new Set([
  "weapon",
  "melee",
  "gloves",
  "sticker",
  "stickerSlab",
  "keychain"
]);

// Agents render only where their patches are previewed, not in every 3D editor.
export const VIEWER_INSPECT_KINDS: ReadonlySet<ViewerItemKind> = new Set([
  ...VIEWER_RENDERABLE_KINDS,
  "agent"
]);

// The viewer's `/api/catalog` manifest: supported(id) = id <= maxId && id not
// inside a [lo, hi] hole. Carries no kind information (non-renderable kinds sit
// interleaved as "present" ids), so it only answers for ids the host already
// classified as renderable via getViewerItemKind.
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

/**
 * Why the server withholds the viewer, in priority order when several apply.
 */
export type ViewerServerReason =
  | "disabled"
  | "pending"
  | "catalog-failed"
  | "rate-limit-check-failed"
  | "rate-limit-check-throttled"
  | "rate-limit-exhausted";

/**
 * The server's verdict for one request, shipped through the root loader.
 * `retryAt` is when the server expects the reason to clear, when known.
 */
export type ViewerServerStatus =
  | { available: true; catalog: ViewerCatalog }
  | { available: false; reason: ViewerServerReason; retryAt?: number };

// Loose for the same reason as ViewerCatalogLike.
export type ViewerServerStatusLike =
  | { available: true; catalog: ViewerCatalogLike }
  | { available: false; reason: ViewerServerReason; retryAt?: number };

export function getViewerCatalog(
  status: ViewerServerStatusLike
): ViewerCatalogLike | undefined {
  return status.available ? status.catalog : undefined;
}

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
  if (viewerItem.keychains !== undefined) {
    for (const keychain of Object.values(viewerItem.keychains)) {
      if (keychain !== undefined) {
        ids.push(keychain.id);
      }
    }
  }
  if (viewerItem.patches !== undefined) {
    ids.push(...Object.values(viewerItem.patches));
  }
  return ids;
}

// Identifies what the viewer resolves against its catalog, so seed, wear and
// sticker placement edits don't escape a block on an unsupported composition.
export function getViewerItemKey(item: ViewerItemInput): string {
  return [...new Set(getViewerItemIds(item))]
    .sort((left, right) => left - right)
    .join(",");
}

export function getViewerItemKind(
  item: ViewerItemInput
): ViewerItemKind | undefined {
  const economyItem =
    item instanceof CS2EconomyItem ? item : CS2Economy.items.get(item.id);
  if (economyItem === undefined) {
    return undefined;
  }
  if (economyItem.isWeapon()) return "weapon";
  if (economyItem.isMelee()) return "melee";
  if (economyItem.isGloves()) return "gloves";
  if (economyItem.isStickerSlab()) return "stickerSlab";
  if (economyItem.isSticker()) return "sticker";
  if (economyItem.isKeychain()) return "keychain";
  if (economyItem.isAgent()) return "agent";
  return undefined;
}

export function isViewerItemSupported(
  catalog: ViewerCatalogLike | undefined,
  item: ViewerItemInput,
  kinds: ReadonlySet<ViewerItemKind> = VIEWER_RENDERABLE_KINDS
): boolean {
  const kind = getViewerItemKind(item);
  return (
    kind !== undefined &&
    kinds.has(kind) &&
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
  if (item.keychains !== undefined) viewerItem.keychains = item.keychains;
  if (item.statTrak !== undefined) viewerItem.statTrak = item.statTrak;
  if (item.nameTag !== undefined) viewerItem.nameTag = item.nameTag;
  if (item.patches !== undefined) viewerItem.patches = item.patches;
  return viewerItem;
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

export function stringifyViewerItem(item: ViewerItemInput): string {
  return stableStringify(toViewerItem(item));
}

export function buildViewerSrc(
  item?: ViewerItemInput,
  options?: {
    embedUrl?: string;
    cdn?: string;
    key?: string;
    icon?: boolean;
    capture?: boolean;
  }
): string {
  const url = new URL(options?.embedUrl ?? DEFAULT_VIEWER_EMBED_URL);
  url.searchParams.set("halfRotation", "1");
  if (item !== undefined) {
    url.searchParams.set("item", stringifyViewerItem(item));
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
  if (options?.capture === true) {
    url.searchParams.set("capture", "");
  }
  return url.toString();
}
