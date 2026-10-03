/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { PetStageLabel } from "~/shared/economy";
import { useTranslate } from "./app-context";
import { InventoryItemTooltipInfo } from "./inventory-item-tooltip-info";

export function InventoryItemTooltipStage({
  upgradeLevel
}: {
  upgradeLevel: number;
}) {
  const translate = useTranslate();

  return (
    <InventoryItemTooltipInfo label={translate("InventoryItemStage")}>
      {translate(`PetStage${PetStageLabel[upgradeLevel]}`)}
    </InventoryItemTooltipInfo>
  );
}
