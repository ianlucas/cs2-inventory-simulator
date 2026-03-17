/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem } from "@ianlucas/cs2-lib";
import { useMemo, useState } from "react";
import { isNewItem } from "~/utils/economy";
import {
  ECONOMY_ITEM_FILTERS,
  EconomyItemFilter,
  getAllPaidItems,
  getBaseItems,
  getPaidItems
} from "~/utils/economy-filters";
import { useCraftFilterRules } from "./use-craft-filter-rules";
import { useInput } from "./use-input";
import { useIsItemCraftable } from "./use-is-item-craftable";

export function useItemPickerState({
  onPickItem
}: {
  onPickItem: (item: CS2EconomyItem) => void;
}) {
  const isItemCraftable = useIsItemCraftable();
  const categoryFilter = useCraftFilterRules();
  const newItems = useMemo(
    () => getAllPaidItems().filter(isNewItem).filter(isItemCraftable),
    []
  );
  const categories = useMemo(() => {
    return ECONOMY_ITEM_FILTERS.filter((filter) => {
      if (filter.isNewItems && newItems.length === 0) {
        return false;
      }
      return categoryFilter(filter);
    });
  }, []);
  const [filter, setFilter] = useState(
    categories[categories[0].isNewItems ? 1 : 0]
  );
  const [model, setModel] = useState<string | undefined>();
  const [query, setQuery] = useInput("");

  function reset() {
    setQuery("");
    setModel(undefined);
  }

  function handleCategoryClick(filter: EconomyItemFilter) {
    setFilter(filter);
    return reset();
  }

  function handleItemClick(item: CS2EconomyItem) {
    if (!filter.hasModel || model !== undefined) {
      return onPickItem(item);
    }
    setQuery("");
    setModel(item.model);
  }

  function filterItem({ altName, name }: CS2EconomyItem) {
    if (query.length < 2) {
      return true;
    }
    return query
      .toLocaleLowerCase()
      .split(" ")
      .every(
        (word) =>
          name.toLocaleLowerCase().includes(word) ||
          altName?.toLocaleLowerCase().includes(word) ||
          false
      );
  }

  const items = useMemo(() => {
    let items: CS2EconomyItem[];
    if (filter.isNewItems) {
      items = newItems.filter(filterItem);
    } else {
      items = (
        model === undefined ? getBaseItems(filter) : getPaidItems(filter, model)
      ).filter(filterItem);
      if (items.length === 0 && query.length >= 3) {
        items = getAllPaidItems().filter(filterItem);
      }
      items = items.filter(isItemCraftable);
    }
    return items.sort((a, b) => a.name.localeCompare(b.name));
  }, [filter, model, query]);

  const ignoreRarityColor = model === undefined && filter.hasModel;

  return {
    categories,
    filter,
    handleCategoryClick,
    handleItemClick,
    ignoreRarityColor,
    items,
    query,
    setQuery
  };
}
