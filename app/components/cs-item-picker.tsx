/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_CATEGORY_MENU, CS_CategoryMenuItem, CS_Item } from "@ianlucas/cslib";
import { useMemo, useState } from "react";
import { CategoryMenu } from "~/components/category-menu";
import { CSItemBrowser } from "~/components/cs-item-browser";
import { useInput } from "~/hooks/use-input";
import { useItemTranslation } from "~/hooks/use-item-translation";
import { useTranslation } from "~/hooks/use-translation";
import { getBaseItems, getPaidItems, instaSelectCategory } from "~/utils/economy";

export default function CSItemPicker({
  onPickItem
}: {
  onPickItem(csItem: CS_Item): void;
}) {
  const [category, setCategory] = useState(CS_CATEGORY_MENU[0]);
  const [model, setModel] = useState<string | undefined>();
  const [query, setQuery] = useInput("");
  const translate = useTranslation();
  const translateItem = useItemTranslation();

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

  function translateAll(item: CS_Item) {
    return {
      ...item,
      name: translateItem(item).name
    };
  }

  const items = useMemo(() =>
    (model === undefined
      ? getBaseItems(category)
      : getPaidItems(category, model)).map(translateAll).filter(
        ({ name }) => {
          if (query.length < 2) {
            return true;
          }
          return name.toLowerCase().includes(query.toLowerCase());
        }
      ), [category, model, query]);

  const ignoreRarityColor = model === undefined
    && !instaSelectCategory.includes(category.category);

  return (
    <>
      <CategoryMenu value={category} onChange={handleCategoryClick} />
      <div className="flex px-2 my-2 gap-2 h-[36px]">
        <input
          value={query}
          onChange={setQuery}
          className="flex-1 outline-none placeholder-neutral-600 bg-neutral-950/40 px-3 rounded"
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
