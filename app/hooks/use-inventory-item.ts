/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useRootContext } from "~/components/root-context";
import { assert } from "~/utils/misc";
import { useFreeze } from "./use-freeze";

export function useInventoryItem(uid: number) {
  const { inventory, items } = useRootContext();
  const item = useFreeze(() => {
    if (uid < 0) {
      const item = items.find(
        ({ item: { uid: otherUid } }) => otherUid === uid
      );
      assert(item, `Item with uid ${uid} not found.`);
      return item.item;
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
