/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_InventoryItem } from "@ianlucas/cslib";
import { useTranslation } from "~/hooks/use-translation";

export function InventoryItemStatTrak({
  inventoryItem: { stattrak }
}: {
  inventoryItem: CS_InventoryItem;
}) {
  const translate = useTranslation();

  return (
    <div>
      <div className="text-blue-300">
        {translate("InventoryItemStatTrakDesc")}
      </div>
      <div className="mt-2 text-orange-400">
        {translate("InventoryItemStatTrakCount")} {stattrak}
      </div>
    </div>
  );
}
