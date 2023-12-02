/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CS_Item } from "@ianlucas/cslib";
import { useMemo, useState } from "react";
import { CSItemBrowser } from "~/components/cs-item-browser";
import { FilterMenu } from "~/components/filter-menu";
import { useInput } from "~/hooks/use-input";
import { useTranslation } from "~/hooks/use-translation";
import { getBaseItems, getPaidItems } from "~/utils/economy";
import { ITEM_FILTERS, ItemFiltersItem } from "~/utils/economy-item-filters";

export default function CSItemPicker({
  onPickItem
}: {
  onPickItem(csItem: CS_Item): void;
}) {
  const [filter, setFilter] = useState(ITEM_FILTERS[0]);
  const [model, setModel] = useState<string | undefined>();
  const [query, setQuery] = useInput("");
  const translate = useTranslation();

  function reset() {
    setQuery("");
    setModel(undefined);
  }

  function handleCategoryClick(filter: ItemFiltersItem) {
    setFilter(filter);
    return reset();
  }

  function handleItemClick(csItem: CS_Item) {
    if (!filter.expand || model !== undefined) {
      return onPickItem(csItem);
    }
    setQuery("");
    setModel(csItem.model);
  }

  const items = useMemo(() =>
    (model === undefined
      ? getBaseItems(filter)
      : getPaidItems(filter, model)).filter(
        ({ name }) => {
          if (query.length < 2) {
            return true;
          }
          return name.toLowerCase().includes(query.toLowerCase());
        }
      ), [filter, model, query]);

  const ignoreRarityColor = model === undefined
    && filter.expand;

  return (
    <>
      <FilterMenu value={filter} onChange={handleCategoryClick} />
      <div className="flex items-center px-4 my-2 gap-2">
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="h-4 text-neutral-500"
        />
        <input
          value={query}
          onChange={setQuery}
          className="flex-1 outline-none placeholder-neutral-600 bg-neutral-950/40 px-3 py-1 rounded"
          placeholder={translate("CraftSearchPlaceholder")}
        />
      </div>
      <div className="pt-1 pb-2">
        <CSItemBrowser
          csItems={items}
          onClick={handleItemClick}
          ignoreRarityColor={ignoreRarityColor}
        />
      </div>
    </>
  );
}
