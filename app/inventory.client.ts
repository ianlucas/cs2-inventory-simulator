/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2InventoryItem } from "@ianlucas/cs2-lib";
import lzstring from "lz-string";

export function getInventoryItemShareUrl(
  item: CS2InventoryItem,
  userId?: string
) {
  return `${window.location.origin}/craft?share=${lzstring.compressToEncodedURIComponent(
    JSON.stringify({ u: userId, i: item.asBase() })
  )}`;
}
