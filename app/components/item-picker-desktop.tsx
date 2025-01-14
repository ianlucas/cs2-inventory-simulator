/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { CS2EconomyItem } from "@ianlucas/cs2-lib";
import { useItemPickerState } from "~/components/hooks/use-item-picker-state";
import { ItemBrowser } from "~/components/item-browser";
import { useLocalize } from "./app-context";
import { IconInput } from "./icon-input";
import { ItemPickerFilterDesktop } from "./item-picker-filter-desktop";

export function ItemPickerDesktop({
  onPickItem
}: {
  onPickItem: (item: CS2EconomyItem) => void;
}) {
  const {
    categories,
    filter,
    handleCategoryClick,
    handleItemClick,
    ignoreRarityColor,
    items,
    query,
    setQuery
  } = useItemPickerState({ onPickItem });
  const localize = useLocalize();

  return (
    <div className="pb-2">
      <div className="mt-2 flex gap-2">
        <ItemPickerFilterDesktop
          categories={categories}
          onChange={handleCategoryClick}
          value={filter}
        />
        <div className="flex-1">
          <IconInput
            icon={faMagnifyingGlass}
            labelStyles="mb-2"
            onChange={setQuery}
            placeholder={localize("CraftSearchPlaceholder")}
            value={query}
          />
          <ItemBrowser
            ignoreRarityColor={ignoreRarityColor}
            items={items}
            maxItemsIntoView={8}
            onClick={handleItemClick}
          />
        </div>
      </div>
    </div>
  );
}
