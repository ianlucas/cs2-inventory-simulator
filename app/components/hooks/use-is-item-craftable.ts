/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem } from "@ianlucas/cs2-lib";
import { useRules } from "~/components/app-context";

export function useIsItemCraftable() {
  const { craftHideCategory, craftHideType, craftHideModel, craftHideId } =
    useRules();

  return function filter(item: CS2EconomyItem) {
    const { id, type, modelKey, loadoutCategory } = item;
    if (
      loadoutCategory !== undefined &&
      craftHideCategory.includes(loadoutCategory)
    ) {
      return false;
    }
    if (craftHideType.includes(type)) {
      return false;
    }
    if (modelKey !== undefined && craftHideModel.includes(modelKey)) {
      return false;
    }
    if (craftHideId.includes(id)) {
      return false;
    }
    return true;
  };
}
