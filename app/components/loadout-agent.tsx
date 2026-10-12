/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2BaseInventoryItem, CS2InventoryItem } from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { toInventoryItem } from "~/shared/inventory";
import { ItemImage } from "./item-image";

export function LoadoutAgent({
  className,
  item
}: {
  className?: string;
  item: CS2InventoryItem | CS2BaseInventoryItem;
}) {
  return (
    <div className={clsx("flex items-center justify-center", className)}>
      <ItemImage className="w-full" item={toInventoryItem(item)} />
    </div>
  );
}
