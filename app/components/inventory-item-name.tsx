/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_InventoryItem } from "@ianlucas/cs2-lib";
import { useNameItemString } from "~/components/hooks/use-name-item";
import { ItemCollectionImage } from "./item-collection-image";

export function InventoryItemName({ item }: { item: CS_InventoryItem }) {
  const nameItemString = useNameItemString();

  if (item.data.collectionname === undefined) {
    return <div className="font-bold">{nameItemString(item)}</div>;
  }

  return (
    <div className="flex items-center gap-1">
      <ItemCollectionImage className="h-10" item={item.data} />
      <div className="flex-1">
        <div className="font-bold">{nameItemString(item)}</div>
        <div>{item.data.collectionname}</div>
      </div>
    </div>
  );
}
