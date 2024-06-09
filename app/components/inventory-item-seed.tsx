/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2InventoryItem, CS2_MIN_SEED } from "@ianlucas/cs2-lib";
import { useLocalize } from "./app-context";

export function InventoryItemSeed({
  inventoryItem: { seed }
}: {
  inventoryItem: CS2InventoryItem;
}) {
  const localize = useLocalize();

  return (
    <div>
      <strong className="text-neutral-400">
        {localize("InventoryItemSeed")}
      </strong>{" "}
      {seed ?? CS2_MIN_SEED}
    </div>
  );
}
