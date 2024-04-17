/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_InventoryItem } from "@ianlucas/cs2-lib";
import { useNameItemString } from "~/hooks/use-name-item";

export function InventoryItemName({
  inventoryItem
}: {
  inventoryItem: CS_InventoryItem;
}) {
  const nameItemString = useNameItemString();
  return <div className="font-bold">{nameItemString(inventoryItem)}</div>;
}
