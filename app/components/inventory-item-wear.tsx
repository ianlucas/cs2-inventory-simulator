/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { wearToString } from "~/shared/economy";
import { useTranslate } from "./app-context";
import { InventoryItemTooltipInfo } from "./inventory-item-tooltip-info";

export function InventoryItemTooltipWear({ wear }: { wear: number }) {
  const translate = useTranslate();
  const left = `${wear * 100}%`;

  return (
    <InventoryItemTooltipInfo
      label={translate("InventoryItemWear")}
      labelClassName="self-start"
    >
      <div>{wearToString(wear)}</div>
      <div className="relative h-1 w-32 bg-[linear-gradient(90deg,#3b818f_0,#3b818f_7%,#83b135_0,#83b135_15%,#d7be47_0,#d7be47_38%,#f08140_0,#f08140_45%,#ec4f3d_0,#ec4f3d)]">
        <div
          className="absolute -top-0.5 h-1.5 w-px bg-white"
          style={{ left }}
        />
      </div>
    </InventoryItemTooltipInfo>
  );
}
