/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2_MIN_SEED } from "@ianlucas/cs2-lib";
import { useTranslate } from "./app-context";
import { InventoryItemTooltipInfo } from "./inventory-item-tooltip-info";

export function InventoryItemTooltipSeed({ seed }: { seed?: number }) {
  const translate = useTranslate();
  return (
    <InventoryItemTooltipInfo label={translate("InventoryItemSeed")}>
      {seed ?? CS2_MIN_SEED}
    </InventoryItemTooltipInfo>
  );
}
