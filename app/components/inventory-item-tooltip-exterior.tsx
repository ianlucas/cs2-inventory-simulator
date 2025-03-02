/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy } from "@ianlucas/cs2-lib";
import { useTranslate } from "./app-context";
import { InventoryItemTooltipInfo } from "./inventory-item-tooltip-info";

export function InventoryItemTooltipExterior({ wear }: { wear: number }) {
  const translate = useTranslate();

  return (
    <InventoryItemTooltipInfo label={translate("InventoryItemExterior")}>
      {translate(`ItemWear${CS2Economy.getWearFromValue(wear)}`)}
    </InventoryItemTooltipInfo>
  );
}
