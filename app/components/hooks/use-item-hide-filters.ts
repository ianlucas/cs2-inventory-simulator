/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useMemo } from "react";
import { useRules } from "~/components/app-context";
import { createItemHideFilter } from "~/shared/economy";

export function useCraftItemFilter({
  attachment = false
}: { attachment?: boolean } = {}) {
  const {
    craftHideCategory,
    craftHideType,
    craftHideFilterType,
    craftHideModel,
    craftHideId
  } = useRules();
  return useMemo(
    () =>
      createItemHideFilter({
        hideCategory: craftHideCategory,
        hideType: craftHideType,
        hideFilterType: attachment ? undefined : craftHideFilterType,
        hideModel: craftHideModel,
        hideId: craftHideId
      }),
    [
      craftHideCategory,
      craftHideType,
      craftHideFilterType,
      craftHideModel,
      craftHideId,
      attachment
    ]
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
