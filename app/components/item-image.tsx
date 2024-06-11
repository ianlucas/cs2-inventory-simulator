/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem, CS2InventoryItem } from "@ianlucas/cs2-lib";
import { ComponentProps } from "react";
import { resolveItemImage } from "~/utils/economy";

export function ItemImage({
  item,
  wear,
  ...props
}: ComponentProps<"img"> & {
  item: CS2EconomyItem | CS2InventoryItem;
  wear?: number;
}) {
  return (
    <img
      alt={item.name}
      draggable={false}
      src={resolveItemImage(
        item,
        wear ?? (item instanceof CS2InventoryItem ? item.wear : undefined)
      )}
      {...props}
    />
  );
}
