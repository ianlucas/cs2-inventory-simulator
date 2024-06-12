/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy } from "@ianlucas/cs2-lib";
import { useLocalize } from "./app-context";
import { InventoryItemInfo } from "./inventory-item-info";

export function InventoryItemExterior({ wear }: { wear: number }) {
  const localize = useLocalize();

  return (
    <InventoryItemInfo label={localize("InventoryItemExterior")}>
      {localize(`ItemWear${CS2Economy.getWearFromValue(wear)}`)}
    </InventoryItemInfo>
  );
}
