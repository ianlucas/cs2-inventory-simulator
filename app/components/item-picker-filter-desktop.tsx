/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { newItemStartingId } from "~/shared/economy";
import { EconomyItemFilter } from "~/shared/economy-filters";
import { useTranslate } from "./app-context";
import { GridList } from "./grid-list";
import { useStorageState } from "./hooks/use-storage-state";
import { ItemPickerFilterIcon } from "./item-picker-filter-icon";
import { SIDE_MENU_ITEM_HEIGHT, SideMenuItem } from "./side-menu-item";

// Match the item browser column height (7 rows * 64px) so the filter list
// never makes the modal taller than the items beside it.
const MAX_FILTERS_INTO_VIEW = 14;

export function ItemPickerFilterDesktop({
  categories,
  onChange,
  value
}: {
  categories: EconomyItemFilter[];
  onChange: (newValue: EconomyItemFilter) => void;
  value: EconomyItemFilter;
}) {
  const translate = useTranslate();
  const [seenNewItemsId, setSeenNewItemsId] = useStorageState(
    "newItemsSeenId",
    0
  );
  const showNewBadge = seenNewItemsId !== newItemStartingId;

  function handleClick(filter: EconomyItemFilter) {
    return function handleClick() {
      if (filter.isNewItems) {
        setSeenNewItemsId(newItemStartingId);
      }
      onChange(filter);
    };
  }

  return (
    <div className="w-55 min-w-42">
      <GridList
        className="rounded-r bg-black/10"
        itemHeight={SIDE_MENU_ITEM_HEIGHT}
        items={categories}
        maxItemsIntoView={Math.min(categories.length, MAX_FILTERS_INTO_VIEW)}
      >
        {(filter, index) => (
          <SideMenuItem
            icon={<ItemPickerFilterIcon icon={filter.icon} className="h-4" />}
            isActive={
              filter.loadoutCategory === value.loadoutCategory &&
              filter.type === value.type
            }
            key={index}
            label={translate(`Category${filter.label}`)}
            onClick={handleClick(filter)}
            right={
              filter.isNewItems &&
              showNewBadge && (
                <FontAwesomeIcon
                  icon={faCircle}
                  className="h-2 animate-pulse text-blue-400"
                />
              )
            }
          />
        )}
      </GridList>
    </div>
  );
}
