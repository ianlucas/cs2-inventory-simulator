/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2ItemType, CS2ItemTypeValues } from "@ianlucas/cs2-lib";
import { useTranslate } from "./app-context";

export function InventoryItemTooltipStatTrak({
  statTrak,
  type
}: {
  statTrak?: number;
  type: CS2ItemTypeValues;
}) {
  const translate = useTranslate();

  return (
    <div className="mt-4">
      <div className="text-blue-300">
        {translate("InventoryItemStatTrakDesc")}
      </div>
      <div className="mt-4 text-orange-400">
        {translate(
          type === CS2ItemType.MusicKit
            ? "InventoryItemMVPStatTrakCount"
            : "InventoryItemStatTrakCount"
        )}{" "}
        {statTrak}
      </div>
    </div>
  );
}
