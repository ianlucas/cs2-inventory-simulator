/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { newItemStartingId } from "~/utils/economy";
import { EconomyItemFilter } from "~/utils/economy-filters";
import { useTranslate } from "./app-context";
import { useStorageState } from "./hooks/use-storage-state";
import { ItemPickerFilterIcon } from "./item-picker-filter-icon";
import { TextSlider } from "./text-slider";

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
    <div className="flex max-w-55 min-w-42">
      <div className="w-full rounded-tr rounded-br bg-black/10 pb-1.5">
        {categories.map((filter, index) => {
          const isActive =
            filter.category === value.category && filter.type === value.type;
          const isIdle = !isActive;
          return (
            <button
              className={clsx(
                "relative flex w-full cursor-default items-center justify-between gap-2 overflow-hidden px-4 py-1 pl-8 text-left transition-all",
                isIdle &&
                  "group text-neutral-500 hover:bg-black/5 hover:text-neutral-300",
                isActive && "bg-black/20 text-blue-500"
              )}
              key={index}
              onClick={handleClick(filter)}
            >
              <ItemPickerFilterIcon
                icon={filter.icon}
                className={clsx(
                  "absolute top-1 left-5 h-4 -rotate-12 opacity-15 transition-all",
                  isActive ? "scale-200" : "scale-150"
                )}
              />
              <div className="font-display min-w-0 flex-1 font-bold whitespace-nowrap drop-shadow-sm">
                <TextSlider text={translate(`Category${filter.label}`)} />
              </div>
              {filter.isNewItems && showNewBadge && (
                <FontAwesomeIcon
                  icon={faCircle}
                  className="h-2 animate-pulse text-blue-400"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
