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
// Type-only (erased) so this module never depends on viewer-api at runtime.
import type { ViewerItem } from "~/utils/viewer-api";

// The public embed URL of the hosted CS2 3D viewer (its `/view` page). Overridable
// per-deployment via the VIEWER_EMBED_URL env var (root loader → `viewerEmbedUrl`
// rule → the viewer component's `embedUrl` client-side, and getViewerOrigin
// server-side) for self-hosting the viewer; this is the fallback when it is unset.
export const DEFAULT_VIEWER_EMBED_URL = "https://3d.cstrike.app/view";

// Anything we can turn into a viewer item: an economy entry, a live inventory
// item, or the plain serialized shape.
export type ViewerItemInput =
  CS2EconomyItem | CS2InventoryItem | CS2BaseInventoryItem;

// The viewer's support manifest (its `/api/catalog`): the max economy id it can render plus the id
// gaps below it. `supported(id) = id <= maxId && id not in holes`. Encodes the complement of the
// viewer's ~12k renderable ids in ~60 bytes, which works because cs2-lib ids are stable + append-only
// (id N is the same item in every version), so the host can compare its OWN ids against this envelope.
// The envelope carries no KIND information — non-renderable kinds are interleaved "present" ids — so
// it only answers for ids the host already classified as renderable (isViewerRenderableKind).
// Resolved server-side (viewer.server.ts) and injected into rules; read synchronously by the gate.
export interface ViewerCatalog {
  maxId: number;
  holes: [number, number][];
}

// The manifest as the gate READS it. Structural + loose on `holes` so it accepts both the server's
// exact `[number, number][]` and the loader-serialized form (SerializeFrom may widen the inner tuples
// to `number[]`). ViewerCatalog is assignable to this.
export type ViewerCatalogLike = {
  maxId: number;
  holes: readonly (readonly number[])[];
};

// Whether the viewer can render economy id `id`, per its manifest. Fail-closed: an absent manifest
// (endpoint down / not yet fetched) reads as unsupported, so the host never offers a 3D viewer it
// can't back — the item-aware gate then keeps that item on the 2D editor.
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

// Every economy id the viewer must render for `item`: its weapon/base id plus each applied sticker's
// id. The gate requires ALL of them to be supported before it offers 3D (a weapon with a
// viewer-unknown sticker falls back to 2D).
export function viewerItemIds(item: ViewerItemInput): number[] {
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

// The kinds the viewer renders — exactly the set its client/economy.ts offers. The manifest
// deliberately encodes only the id ENVELOPE: non-renderable kinds (music kits, collectibles,
// agents, ...) sit interleaved as "present" ids in it, so classifying kind is the host's half of
// the catalog contract. Fail-closed: an id the loaded economy doesn't know reads as unsupported.
function isViewerRenderableKind(item: ViewerItemInput): boolean {
  const economyItem =
    item instanceof CS2EconomyItem ? item : CS2Economy.items.get(item.id);
  return (
    economyItem !== undefined &&
    (economyItem.isWeapon() || economyItem.isMelee() || economyItem.isSticker())
  );
}

// Whether the viewer can render `item` in full — a renderable kind (weapon/melee/sticker) whose
// body and every applied sticker sit inside the catalog envelope.
export function isViewerItemSupported(
  catalog: ViewerCatalogLike | undefined,
  item: ViewerItemInput
): boolean {
  return (
    isViewerRenderableKind(item) &&
    viewerItemIds(item).every((id) => isViewerIdSupported(catalog, id))
  );
}

// Narrow any accepted item into the subset the viewer reads (id/seed/wear/
// stickers/statTrak/nameTag), dropping undefined fields so the viewer overlays
// its own defaults.
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

// Build the iframe `src`: the viewer URL with the initial state encoded as the
// `?item=` JSON param (the embed API takes over after load). `key`/`cdn`/`icon` map
// to the viewer's other query params; `cdn` points the viewer at a self-hosted mirror
// of its economy asset tree (weapon models, textures, sticker masks, model-data).
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
