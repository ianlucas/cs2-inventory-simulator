/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2InventoryItem } from "@ianlucas/cs2-lib";
import { useNameItemString } from "~/components/hooks/use-name-item";
import { ItemImage } from "./item-image";

export function InventoryItemTooltipName({ item }: { item: CS2InventoryItem }) {
  const nameItemString = useNameItemString();

  if (item.collectionName === undefined) {
    return <div className="font-bold">{nameItemString(item)}</div>;
  }

  return (
    <div className="flex items-center gap-1">
      <ItemImage className="h-10" item={item} type="collection" />
      <div className="flex-1">
        <div className="font-bold">{nameItemString(item)}</div>
        <div>{item.collectionName}</div>
      </div>
    </div>
  );
}
