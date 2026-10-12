/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2BaseInventoryItem, CS2InventoryItem } from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { toInventoryItem } from "~/shared/inventory";
import { useViewerIcon } from "./hooks/use-viewer-icon";
import { ItemImage } from "./item-image";

export function LoadoutItemImage({
  className,
  item
}: {
  className?: string;
  item: CS2InventoryItem | CS2BaseInventoryItem;
}) {
  const { ref, url } = useViewerIcon(item, { enabled: true });
  const inventoryItem = toInventoryItem(item);
  return (
    <div className={clsx("flex justify-center", className)} ref={ref}>
      {url !== undefined ? (
        <img
          alt={inventoryItem.name}
          className="aspect-256/192 h-full"
          draggable={false}
          src={url}
        />
      ) : (
        <ItemImage className="h-full" item={inventoryItem} />
      )}
    </div>
  );
}
