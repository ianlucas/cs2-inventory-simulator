/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { parseInventory } from "./inventory";
import { getFromLocalStorage, setToLocalStorage } from "./localstorage";

export function cacheInventoryData(value: string) {
  return setToLocalStorage("inventoryItems", value);
}

export function getCachedInventoryData() {
  return parseInventory(getFromLocalStorage("inventoryItems"));
}

export function getSanitizedCachedInventoryData() {
  const data = getCachedInventoryData();
  if (data === undefined) {
    return undefined;
  }
  return {
    ...data,
    items: Object.fromEntries(
      Object.entries(data.items).map(([uid, value]) => [
        uid,
        {
          ...value,
          equipped: undefined,
          equippedCT: undefined,
          equippedT: undefined,
          statTrak: value.statTrak !== undefined ? (0 as const) : undefined,
          storage:
            value.storage !== undefined
              ? Object.fromEntries(
                  Object.entries(value.storage).map(([uid, value]) => [
                    uid,
                    {
                      ...value,
                      statTrak:
                        value.statTrak !== undefined ? (0 as const) : undefined,
                      storage: undefined
                    }
                  ])
                )
              : undefined
        }
      ])
    )
  };
}
