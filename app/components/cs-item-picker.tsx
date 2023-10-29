/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_CATEGORY_MENU, CS_CategoryMenuItem, CS_Item } from "@ianlucas/cslib";
import { useState } from "react";
import { CategoryMenu } from "~/components/category-menu";
import { CSItemBrowser } from "~/components/cs-item-browser";
import { useInput } from "~/hooks/use-input";
import { getBaseItems, getPaidItems, instaSelectCategory } from "~/utils/economy";

export default function CSItemPicker({
  onPickItem
}: {
  onPickItem(csItem: CS_Item): void;
}) {
  const [category, setCategory] = useState(CS_CATEGORY_MENU[0]);
  const [model, setModel] = useState<string | undefined>();
  const [query, setQuery] = useInput("");

  function reset() {
    setQuery("");
    setModel(undefined);
  }

  function handleCategoryClick(category: CS_CategoryMenuItem) {
    setCategory(category);
    return reset();
  }

  function handleItemClick(csItem: CS_Item) {
    if (instaSelectCategory.includes(csItem.type) || model !== undefined) {
      return onPickItem(csItem);
    }
    setQuery("");
    setModel(csItem.model);
  }

  const items = (model === undefined
    ? getBaseItems(category)
    : getPaidItems(category, model)).filter(
      ({ name }) => {
        if (query.length < 2) {
          return true;
        }
        return name.toLowerCase().includes(query.toLowerCase());
      }
    );

  const ignoreRarityColor = model === undefined
    && !instaSelectCategory.includes(category.category);

  return (
    <>
      <CategoryMenu value={category} onChange={handleCategoryClick} />
      <div className="flex pr-4 my-2 gap-2 h-[36px] pl-4">
        <input
          value={query}
          onChange={setQuery}
          className="flex-1 outline-none placeholder-neutral-600 bg-neutral-950/40 px-3 rounded"
          placeholder="Search for an item..."
        />
      </div>
      <div className="py-1">
        <CSItemBrowser
          csItems={items}
          onClick={handleItemClick}
          ignoreRarityColor={ignoreRarityColor}
        />
      </div>
    </>
  );
}
