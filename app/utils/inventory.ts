/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS_Economy,
  CS_InventoryItem,
  CS_Item,
  CS_NONE
} from "@ianlucas/cs2-lib";
import { serverInventoryShape } from "./shapes";

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
  try {
    if (!inventory) {
      return [];
    }
    return serverInventoryShape.parse(JSON.parse(inventory));
  } catch {
    return [];
  }
}

export function createFakeInventoryItem(
  data: CS_Item,
  item?: Partial<CS_InventoryItem>
) {
  return {
    data,
    id: data.id,
    uid: -1,
    ...item
  } satisfies CS_InventoryItem;
}

export function getFreeItemsToDisplay(hideFreeItems = false) {
  if (hideFreeItems) {
    return [];
  }
  return CS_Economy.filterItems({
    free: true
  }).map((item, index) => ({
    equipped: [],
    item: createFakeInventoryItem(item, {
      uid: -1 * (index + 1)
    }),
    uid: -1 * (index + 1)
  }));
}

export function getStickerCount(stickers?: number[]) {
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
  if (data.type === "agent") {
    [model, name] = name.split(" | ");
  } else if (["collectible", "case", "key", "tool"].includes(data.type)) {
    model = name;
    name = "";
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
      if (data.type === "agent") {
        [name, model] = [model, name];
      } else if (name.length === 0) {
        name = model;
        model = "";
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
