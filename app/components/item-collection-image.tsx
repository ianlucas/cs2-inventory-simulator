/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem } from "@ianlucas/cs2-lib";
import { ComponentProps } from "react";

export function ItemCollectionImage({
  item,
  ...props
}: ComponentProps<"img"> & {
  item: CS2EconomyItem;
}) {
  return (
    <img
      alt={item.name}
      draggable={false}
      src={item.getCollectionImage()}
      {...props}
    />
  );
}
