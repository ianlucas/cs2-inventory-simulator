/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_InventoryItem } from "@ianlucas/cs2-lib";
import { useTranslate } from "./app-context";

export function InventoryItemStatTrak({
  inventoryItem: { data, stattrak }
}: {
  inventoryItem: CS_InventoryItem;
}) {
  const translate = useTranslate();

  return (
    <div className="mt-2">
      <div className="text-blue-300">
        {translate("InventoryItemStatTrakDesc")}
      </div>
      <div className="mt-4 text-orange-400">
        {translate(
          data.type === "musickit"
            ? "InventoryItemMVPStatTrakCount"
            : "InventoryItemStatTrakCount"
        )}{" "}
        {stattrak}
      </div>
    </div>
  );
}
