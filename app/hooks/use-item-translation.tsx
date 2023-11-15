/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Item } from "@ianlucas/cslib";
import { useRootContext } from "~/components/root-context";
import { modelFromType } from "~/utils/economy";
import { useTranslation } from "./use-translation";

export function useItemTranslation() {
  const { itemTranslation } = useRootContext();
  const translate = useTranslation();
  return function translateItem(csItem: CS_Item) {
    const translatedName = itemTranslation[csItem.id] || csItem.name;
    if (csItem.free && csItem.base) {
      return {
        model: "",
        name: translatedName
      };
    }
    if (["weapon", "melee", "glove"].includes(csItem.type) && !csItem.free) {
      const [weaponName, ...paintName] = translatedName
        .split("|");
      return {
        model: (csItem.type === "melee" ? "★ " : "") + weaponName.trim(),
        name: paintName.join("|")
      };
    }
    return {
      model: translate(`Model${modelFromType[csItem.type]}`),
      name: translatedName
    };
  };
}
