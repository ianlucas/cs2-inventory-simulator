/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useMemo } from "react";
import { useRules } from "~/components/app-context";
import { createItemHideFilter } from "~/utils/economy";

export function useCraftItemFilter() {
  const { craftHideCategory, craftHideType, craftHideModel, craftHideId } =
    useRules();
  return useMemo(
    () =>
      createItemHideFilter({
        hideCategory: craftHideCategory,
        hideType: craftHideType,
        hideModel: craftHideModel,
        hideId: craftHideId
      }),
    [craftHideCategory, craftHideType, craftHideModel, craftHideId]
  );
}

export function useEditItemFilter() {
  const { editHideCategory, editHideType, editHideModel, editHideId } =
    useRules();
  return useMemo(
    () =>
      createItemHideFilter({
        hideCategory: editHideCategory,
        hideType: editHideType,
        hideModel: editHideModel,
        hideId: editHideId
      }),
    [editHideCategory, editHideType, editHideModel, editHideId]
  );
}
