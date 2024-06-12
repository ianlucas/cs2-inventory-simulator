/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2ItemType, CS2ItemTypeValues } from "@ianlucas/cs2-lib";
import { useLocalize } from "./app-context";

export function InventoryItemTooltipStatTrak({
  statTrak,
  type
}: {
  statTrak?: number;
  type: CS2ItemTypeValues;
}) {
  const localize = useLocalize();

  return (
    <div className="mt-4">
      <div className="text-blue-300">
        {localize("InventoryItemStatTrakDesc")}
      </div>
      <div className="mt-4 text-orange-400">
        {localize(
          type === CS2ItemType.MusicKit
            ? "InventoryItemMVPStatTrakCount"
            : "InventoryItemStatTrakCount"
        )}{" "}
        {statTrak}
      </div>
    </div>
  );
}
