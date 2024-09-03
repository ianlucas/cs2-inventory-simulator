/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem } from "@ianlucas/cs2-lib";
import { useRules } from "~/components/app-context";

export function useIsItemCraftable() {
  const { craftHideCategory, craftHideType, craftHideModel, craftHideId } =
    useRules();

  return function filter({ category, id, type, model }: CS2EconomyItem) {
    if (category !== undefined && craftHideCategory.includes(category)) {
      return false;
    }
    if (craftHideType.includes(type)) {
      return false;
    }
    if (model !== undefined && craftHideModel.includes(model)) {
      return false;
    }
    if (craftHideId.includes(id)) {
      return false;
    }
    return true;
  };
}
