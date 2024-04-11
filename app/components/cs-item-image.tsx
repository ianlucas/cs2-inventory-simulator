/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Item } from "@ianlucas/cs2-lib";
import { ComponentProps } from "react";
import { resolveItemImage } from "~/utils/economy";

export function CSItemImage({
  item,
  wear,
  ...props
}: ComponentProps<"img"> & {
  item: CS_Item;
  wear?: number;
}) {
  return (
    <img
      alt={item.name}
      draggable={false}
      src={resolveItemImage(item, wear)}
      {...props}
    />
  );
}
