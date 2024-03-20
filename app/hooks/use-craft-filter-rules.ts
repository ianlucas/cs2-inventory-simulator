/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useRootContext } from "~/components/root-context";
import { ItemFilter } from "~/utils/filters";

export function useCraftFilterRules() {
  const {
    rules: { craftHideCategory, craftHideType }
  } = useRootContext();

  return function filter({ category, type }: ItemFilter) {
    if (category !== undefined && craftHideCategory.includes(category)) {
      return false;
    }
    if (type !== undefined && craftHideType.includes(type)) {
      return false;
    }
    return true;
  };
}
