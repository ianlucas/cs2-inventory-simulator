import type { CS_InventoryItem } from "cslib";
import { inventoryShape } from "./shapes";

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

export function storeInventoryItems(value: CS_InventoryItem[]) {
  if (typeof document !== "undefined") {
    return window.localStorage.setItem("inventoryItems", JSON.stringify(value));
  }
}

export function retrieveInventoryItems() {
  try {
    return (JSON.parse(
      window.localStorage.getItem("inventoryItems")!
    ) || []) as CS_InventoryItem[];
  } catch {
    return [];
  }
}

export function parseInventory(inventory: any) {
  try {
    return inventoryShape.parse(JSON.parse(inventory));
  } catch {
    return [];
  }
}
