/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_InventoryItem } from "@ianlucas/cs2-lib";
import { getItemNameString } from "~/utils/inventory";

export function InventoryItemName({
  inventoryItem
}: {
  inventoryItem: CS_InventoryItem;
}) {
  const name = getItemNameString(inventoryItem);
  return <div className="font-bold">{name}</div>;
}
