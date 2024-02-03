/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CS_Item } from "@ianlucas/cslib";
import { CSItemBrowser } from "~/components/cs-item-browser";
import { FilterMenuMobile } from "~/components/filter-menu-mobile";
import { useItemPickerState } from "~/hooks/use-item-picker-state";
import { useTranslation } from "~/hooks/use-translation";

export function CSItemPickerMobile({
  onPickItem
}: {
  onPickItem: (item: CS_Item) => void;
}) {
  const {
    filter,
    handleCategoryClick,
    handleItemClick,
    ignoreRarityColor,
    items,
    query,
    setQuery
  } = useItemPickerState({ onPickItem });
  const translate = useTranslation();

  return (
    <>
      <FilterMenuMobile value={filter} onChange={handleCategoryClick} />
      <div className="my-2 flex items-center gap-2 px-4">
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="h-4 text-neutral-500"
        />
        <input
          value={query}
          onChange={setQuery}
          className="flex-1 rounded bg-neutral-950/40 px-3 py-1 placeholder-neutral-600 outline-none"
          placeholder={translate("CraftSearchPlaceholder")}
        />
      </div>
      <div className="pb-2 pt-1">
        <CSItemBrowser
          items={items}
          onClick={handleItemClick}
          ignoreRarityColor={ignoreRarityColor}
        />
      </div>
    </>
  );
}
