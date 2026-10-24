/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem } from "@ianlucas/cs2-lib";
import { useInventory, useRules } from "~/components/app-context";
import { toArrayIf } from "~/shared/misc";
import { useCraftItemFilter } from "./use-item-hide-filters";

export function useCraftShortcutMaxQuantity(
  item: CS2EconomyItem,
  limit: number
) {
  const [inventory] = useInventory();
  const { craftMaxQuantity, inventoryMaxItems } = useRules();
  const isItemCraftable = useCraftItemFilter();
  if (!isItemCraftable(item)) {
    return 0;
  }
  return Math.min(
    inventoryMaxItems - inventory.size(),
    limit,
    ...toArrayIf(craftMaxQuantity, (n) => n > 0)
  );
}
