/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ensure } from "@ianlucas/cs2-lib";
import { useInventory, useInventoryItems } from "~/components/app-context";
import { useFreeze } from "./use-freeze";

export function useInventoryItem(uid: number) {
  const [inventory] = useInventory();
  const items = useInventoryItems();
  const item = useFreeze(() => {
    // Negative UIDs are free items added by us if setting is enabled.
    if (uid < 0) {
      return ensure(
        items.find(({ item: { uid: xuid } }) => xuid === uid)?.item
      );
    }
    return inventory.get(uid);
  });
  return item;
}

export function useTryInventoryItem(uid?: number) {
  if (uid === undefined) {
    return undefined;
  }
  return useInventoryItem(uid);
}
