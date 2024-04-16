/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Item } from "@ianlucas/cs2-lib";
import { ComponentProps } from "react";
import { resolveCollectionImage } from "~/utils/economy";

export function ItemCollectionImage({
  item,
  ...props
}: ComponentProps<"img"> & {
  item: CS_Item;
}) {
  return (
    <img
      alt={item.name}
      draggable={false}
      src={resolveCollectionImage(item)}
      {...props}
    />
  );
}
