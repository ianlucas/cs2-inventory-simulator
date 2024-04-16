/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Item } from "@ianlucas/cs2-lib";
import { useAppContext } from "~/components/app-context";

export function useCraftItemRules() {
  const {
    rules: { craftHideCategory, craftHideType, craftHideModel, craftHideId }
  } = useAppContext();

  return function filter({ category, id, type, model }: CS_Item) {
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
