/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_InventoryItem, CS_MIN_SEED } from "@ianlucas/cslib";
import { useRootContext } from "./root-context";

export function InventoryItemSeed({
  inventoryItem: { seed }
}: {
  inventoryItem: CS_InventoryItem;
}) {
  const {
    translations: { translate }
  } = useRootContext();

  return (
    <div>
      <strong className="text-neutral-400">
        {translate("InventoryItemSeed")}
      </strong>{" "}
      {seed ?? CS_MIN_SEED}
    </div>
  );
}
