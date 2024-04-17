/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Economy, CS_InventoryItem, CS_Item } from "@ianlucas/cs2-lib";
import { useTranslate } from "~/components/app-context";
import { resolveCSItem, resolveInventoryItem } from "~/utils/inventory";
import { has } from "~/utils/misc";

export function useNameItem() {
  const translate = useTranslate();
  return function nameItem(
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
        ? `${translate("InventoryItemStatTrak")} `
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
  };
}

export function useNameItemString() {
  const nameItem = useNameItem();
  return function nameItemString(
    ...args: Parameters<ReturnType<typeof useNameItem>>
  ) {
    return nameItem(...args)
      .filter((value) => has(value))
      .join(" | ");
  };
}
