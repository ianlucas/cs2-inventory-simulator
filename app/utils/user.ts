/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { parseInventory } from "./inventory";

export function storeUserId(value: string) {
  if (typeof document !== "undefined") {
    return window.localStorage.setItem("userId", value);
  }
}

export function retrieveUserId() {
  if (typeof document !== "undefined") {
    return window.localStorage.getItem("userId");
  }
}

export function storeInventoryData(value: string) {
  if (typeof document !== "undefined") {
    return window.localStorage.setItem("inventoryItems", value);
  }
}

export function retrieveInventoryData() {
  if (typeof document !== "undefined") {
    return parseInventory(window.localStorage.getItem("inventoryItems"));
  }
  return undefined;
}
