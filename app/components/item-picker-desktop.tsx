/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ItemBrowser } from "~/components/item-browser";
import { type ItemPickerState } from "./hooks/use-item-picker-state";
import { ItemPickerFilterDesktop } from "./item-picker-filter-desktop";

export function ItemPickerDesktop({
  categories,
  filter,
  handleCategoryClick,
  handleItemClick,
  ignoreRarityColor,
  items
}: ItemPickerState) {
  return (
    <div className="pb-2">
      <div className="mt-2 flex gap-2">
        <ItemPickerFilterDesktop
          categories={categories}
          onChange={handleCategoryClick}
          value={filter}
        />
        <div className="flex-1">
          <ItemBrowser
            ignoreRarityColor={ignoreRarityColor}
            items={items}
            maxItemsIntoView={7}
            onClick={handleItemClick}
          />
        </div>
      </div>
    </div>
  );
}
