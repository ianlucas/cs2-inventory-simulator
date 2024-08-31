/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useMemo } from "react";
import { useRules } from "~/components/app-context";
import { EconomyItemFilter } from "~/utils/economy-filters";

export function useCraftFilterRules() {
  const { craftHideCategory, craftHideType } = useRules();
  return useMemo(
    () =>
      function filter({ category, type }: EconomyItemFilter) {
        if (category !== undefined && craftHideCategory.includes(category)) {
          return false;
        }
        if (type !== undefined && craftHideType.includes(type)) {
          return false;
        }
        return true;
      },
    [craftHideCategory, craftHideType]
  );
}
