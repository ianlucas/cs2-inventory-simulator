/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { createFakeInventoryItemFromBase } from "~/shared/inventory";
import { LoadoutItem } from "~/shared/loadout";
import { ItemImage } from "./item-image";

export function LoadoutAgent({
  className,
  item
}: {
  className?: string;
  item: LoadoutItem;
}) {
  return (
    <div className={clsx("flex items-center justify-center", className)}>
      <ItemImage
        className="w-full"
        item={createFakeInventoryItemFromBase(item.item)}
      />
    </div>
  );
}
