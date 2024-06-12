/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2InventoryItem, CS2ItemType } from "@ianlucas/cs2-lib";
import { useLocalize } from "./app-context";

export function InventoryItemStatTrak({
  inventoryItem: { type, statTrak }
}: {
  inventoryItem: CS2InventoryItem;
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
