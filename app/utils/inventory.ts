/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS_Economy,
  CS_InventoryItem,
  CS_Item,
  CS_NONE,
  CS_RARITY_COLORS,
  CS_RARITY_ORDER
} from "@ianlucas/cs2-lib";
import { serverInventoryShape } from "./shapes";

export const HIDE_ITEM_MODEL_TYPE = ["case", "collectible", "key", "tool"];
export const UNLOCKABLE_ITEM_TYPE = ["case", "key"];
export const EDITABLE_ITEM_TYPE = ["weapon", "melee", "glove", "musickit"];
export const INSPECTABLE_ITEM_TYPE = [
  "case",
  "collectible",
  "glove",
  "graffiti",
  "melee",
  "musickit",
  "patch",
  "sticker",
  "weapon"
];

export function parseInventory(inventory?: string | null) {
  if (!inventory) {
    return [];
  }
  try {
    return serverInventoryShape.parse(JSON.parse(inventory));
  } catch {
    return [];
  }
}

export function transform(
  item: CS_InventoryItem,
  nonEquippable = {
    models: [] as string[],
    types: [] as string[]
  }
) {
  const isEquippable =
    (item.data.model === undefined ||
      !nonEquippable.models.includes(item.data.model)) &&
    !nonEquippable.types.includes(item.data.type);

  if (!isEquippable) {
    item.equipped = undefined;
    item.equippedCT = undefined;
    item.equippedT = undefined;
  }

  return {
    equipped: [
      item.equipped && "text-white",
      item.equippedCT && "text-sky-300",
      item.equippedT && "text-yellow-400"
    ],
    item,
    uid: item.uid
  };
}

export type TransformedInventoryItem = ReturnType<typeof transform>;
export type TransformedInventoryItems = TransformedInventoryItem[];

export function sortByName(
  a: TransformedInventoryItem,
  b: TransformedInventoryItem
) {
  return a.item.data.name.localeCompare(b.item.data.name);
}

const typeOrder = {
  weapon: 0,
  melee: 1,
  glove: 2,
  agent: 3,
  patch: 4,
  collectible: 5,
  musickit: 6,
  graffiti: 7,
  sticker: 8,
  case: 9,
  key: 10,
  tool: 11
} as const;

export function sortByType(
  a: TransformedInventoryItem,
  b: TransformedInventoryItem
) {
  return typeOrder[a.item.data.type] - typeOrder[b.item.data.type];
}

export function sortByEquipped(
  a: TransformedInventoryItem,
  b: TransformedInventoryItem
) {
  const equippedA = a.item.equipped || a.item.equippedCT || a.item.equippedT;
  const equippedB = b.item.equipped || b.item.equippedCT || b.item.equippedT;
  if (equippedA && !equippedB) {
    return -1;
  } else if (!equippedA && equippedB) {
    return 1;
  } else {
    return 0;
  }
}

export function sortByNewest(
  a: TransformedInventoryItem,
  b: TransformedInventoryItem
) {
  return (b.item.updatedat ?? 0) - (a.item.updatedat ?? 0);
}

export function sortByQuality(
  a: TransformedInventoryItem,
  b: TransformedInventoryItem
) {
  return (
    CS_RARITY_ORDER.indexOf(CS_RARITY_COLORS[b.item.data.rarity] as any) -
    CS_RARITY_ORDER.indexOf(CS_RARITY_COLORS[a.item.data.rarity] as any)
  );
}

export function sortByCollection(
  a: TransformedInventoryItem,
  b: TransformedInventoryItem
) {
  return (b.item.data.collectionname ?? "").localeCompare(
    a.item.data.collectionname ?? ""
  );
}

export function getFreeItemsToDisplay(hideFreeItems = false) {
  if (hideFreeItems) {
    return [];
  }
  return CS_Economy.filterItems({
    free: true
  }).map((item, index) => ({
    equipped: [],
    item: {
      data: item,
      id: item.id,
      uid: -1 * (index + 1)
    } satisfies CS_InventoryItem,
    uid: -1 * (index + 1)
  }));
}

export function countStickers(stickers?: number[]) {
  if (stickers === undefined) {
    return 0;
  }
  return stickers.filter((sticker) => sticker !== CS_NONE).length;
}

export function resolveInventoryItem(item: CS_Item | CS_InventoryItem) {
  return (item as CS_InventoryItem).uid !== undefined
    ? (item as CS_InventoryItem)
    : undefined;
}

export function resolveCSItem(item: CS_Item | CS_InventoryItem) {
  return (item as CS_InventoryItem).uid !== undefined
    ? (item as CS_InventoryItem).data
    : (item as CS_Item);
}

export function getItemName(
  item: CS_Item | CS_InventoryItem,
  formatter:
    | "case-contents-name"
    | "craft-name"
    | "default"
    | "editor-name"
    | "inventory-name" = "default"
) {
  const inventoryItem = resolveInventoryItem(item);
  const data = resolveCSItem(item);
  const nametag =
    inventoryItem?.nametag !== undefined ? `"${inventoryItem.nametag}"` : "";
  const stattrak =
    inventoryItem?.stattrak !== undefined
      ? `${window.$systemTranslation.InventoryItemStatTrak} `
      : "";
  const quality = data.type === "melee" && !data.free ? "★ " : "";
  let [model, ...names] = data.name.split(" | ");
  let name = names.join(" | ");
  model = `${quality}${stattrak}${model}`;
  if (["collectible", "case", "key", "tool"].includes(data.type)) {
    model = name;
    name = "";
  }
  if (data.type === "agent") {
    [model, name] = name.split(" | ");
  }
  switch (formatter) {
    case "case-contents-name":
      if (!["weapon", "melee", "collectible"].includes(data.type)) {
        model = "";
      }
      return [model, name];
    case "craft-name":
      return [name.length > 0 && data.type !== "agent" ? name : model];
    case "default":
      return [model, name];
    case "editor-name":
      if (name.length === 0) {
        name = model;
        model = "";
      }
      if (data.type === "agent") {
        [name, model] = [model, name];
      }
      return [model, name];
    case "inventory-name":
      if (nametag.length > 0) {
        if (!CS_Economy.isStorageUnitTool(data)) {
          model = "";
        }
        name = nametag;
      }
      return [model, name];
  }
  return [];
}

export function getItemNameString(...args: Parameters<typeof getItemName>) {
  return getItemName(...args)
    .filter((value) => value.length > 0)
    .join(" | ");
}
