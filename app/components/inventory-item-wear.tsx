/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_InventoryItem, CS_MAX_WEAR, CS_MIN_WEAR } from "@ianlucas/cs2-lib";
import { wearToString } from "~/utils/economy";
import { useTranslate } from "./app-context";

export function InventoryItemWear({
  inventoryItem: {
    wear,
    data: { wearmin }
  }
}: {
  inventoryItem: CS_InventoryItem;
}) {
  const translate = useTranslate();
  const left = `${((wear ?? CS_MIN_WEAR) / CS_MAX_WEAR) * 100}%`;

  return (
    <div>
      <div>
        <strong className="text-neutral-400">
          {translate("InventoryItemWear")}
        </strong>{" "}
        {wearToString(wear ?? wearmin ?? CS_MIN_WEAR)}
      </div>
      <div className="relative h-1 w-[128px] bg-[linear-gradient(90deg,#3b818f_0,#3b818f_7%,#83b135_0,#83b135_15%,#d7be47_0,#d7be47_38%,#f08140_0,#f08140_45%,#ec4f3d_0,#ec4f3d)]">
        <div
          className="absolute -top-0.5 h-1.5 w-[1px] bg-white"
          style={{ left }}
        />
      </div>
    </div>
  );
}
