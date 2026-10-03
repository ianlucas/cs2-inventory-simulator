/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useTranslate } from "./app-context";
import { InventoryItemTooltipInfo } from "./inventory-item-tooltip-info";

export function InventoryItemTooltipStyle({ style }: { style?: number }) {
  const translate = useTranslate();

  return (
    <InventoryItemTooltipInfo label={translate("InventoryItemStyle")}>
      {style !== undefined ? style : translate("PetStyleDefault")}
    </InventoryItemTooltipInfo>
  );
}
