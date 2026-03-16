/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/** Map name (e.g. from gamedig) → thumbnail URL. Fixed CS2 set only. */
export const MAP_THUMBNAILS: Record<string, string> = {
  de_dust2: "/images/maps/de_dust2_png.png",
  de_mirage: "/images/maps/de_mirage_png.png",
  de_inferno: "/images/maps/de_inferno_png.png",
  de_nuke: "/images/maps/de_nuke_png.png",
  de_ancient: "/images/maps/de_ancient_png.png",
  de_anubis: "/images/maps/de_anubis_png.png",
  de_vertigo: "/images/maps/de_vertigo_png.png"
};

/** Fallback when map name is unknown. */
export const FALLBACK_MAP_THUMBNAIL_URL = "/images/map-fallback.png";

export function getMapThumbnailUrl(mapName: string): string {
  return MAP_THUMBNAILS[mapName] ?? FALLBACK_MAP_THUMBNAIL_URL;
}
