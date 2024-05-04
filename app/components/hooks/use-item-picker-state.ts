/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Item } from "@ianlucas/cs2-lib";
import { useMemo, useState } from "react";
import {
  ECONOMY_ITEM_FILTERS,
  EconomyItemFilter,
  getBaseItems,
  getPaidItems
} from "~/utils/economy-filters";
import { useCraftFilterRules } from "./use-craft-filter-rules";
import { useCraftItemRules } from "./use-craft-item-rules";
import { useInput } from "./use-input";

export function useItemPickerState({
  onPickItem
}: {
  onPickItem: (item: CS_Item) => void;
}) {
  const itemFilter = useCraftItemRules();
  const categoryFilter = useCraftFilterRules();
  const categories = ECONOMY_ITEM_FILTERS.filter(categoryFilter);
  const [filter, setFilter] = useState(categories[0]);
  const [model, setModel] = useState<string | undefined>();
  const [query, setQuery] = useInput("");

  function reset() {
    setQuery("");
    setModel(undefined);
  }

  function handleFilterClick(filter: EconomyItemFilter) {
    setFilter(filter);
    return reset();
  }

  function handleItemClick(item: CS_Item) {
    if (!filter.hasModel || model !== undefined) {
      return onPickItem(item);
    }
    setQuery("");
    setModel(item.model);
  }

  const items = useMemo(
    () =>
      (model === undefined ? getBaseItems(filter) : getPaidItems(filter, model))
        .filter(({ altname, name }) => {
          if (query.length < 2) {
            return true;
          }
          const queryLower = query.toLocaleLowerCase();
          return (
            name.toLocaleLowerCase().includes(queryLower) ||
            altname?.toLocaleLowerCase().includes(queryLower)
          );
        })
        .filter(itemFilter)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [filter, model, query]
  );

  const ignoreRarityColor = model === undefined && filter.hasModel;

  return {
    categories,
    filter,
    handleCategoryClick: handleFilterClick,
    handleItemClick,
    ignoreRarityColor,
    items,
    query,
    setQuery
  };
}
