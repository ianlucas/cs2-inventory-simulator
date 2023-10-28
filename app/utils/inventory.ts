import { CS_Economy, CS_InventoryItem } from "cslib";
import { getCSItemName } from "./economy";

export function transform(inventoryItem: CS_InventoryItem, index: number) {
  const csItem = CS_Economy.getById(inventoryItem.id);
  return {
    csItem,
    inventoryItem,
    index,
    equipped: [
      inventoryItem.equipped && "text-white",
      inventoryItem.equippedCT && "text-sky-300",
      inventoryItem.equippedT && "text-yellow-400"
    ],
    ...getCSItemName(csItem)
  };
}

type TransformedInventoryItem = ReturnType<typeof transform>;

export function sortByName(
  a: TransformedInventoryItem,
  b: TransformedInventoryItem
) {
  return a.csItem.name.localeCompare(b.csItem.name);
}

const typeOrder = {
  "weapon": 0,
  "melee": 1,
  "glove": 2,
  "agent": 3,
  "patch": 4,
  "pin": 5,
  "musickit": 6,
  "sticker": 7
} as const;

export function sortByType(
  a: TransformedInventoryItem,
  b: TransformedInventoryItem
) {
  return typeOrder[a.csItem.type] - typeOrder[b.csItem.type];
}

export function sortByEquipped(
  a: TransformedInventoryItem,
  b: TransformedInventoryItem
) {
  const equippedA = a.inventoryItem.equipped || a.inventoryItem.equippedCT
    || a.inventoryItem.equippedT;
  const equippedB = b.inventoryItem.equipped || b.inventoryItem.equippedCT
    || b.inventoryItem.equippedT;
  if (equippedA && !equippedB) {
    return -1;
  } else if (!equippedA && equippedB) {
    return 1;
  } else {
    return 0;
  }
}
