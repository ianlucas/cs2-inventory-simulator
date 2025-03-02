/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem, CS2InventoryItem } from "@ianlucas/cs2-lib";
import { ComponentProps } from "react";

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
      src={item.getImage(wear)}
      {...props}
    />
  );
}
