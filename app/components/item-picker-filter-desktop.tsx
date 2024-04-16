/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { EconomyItemFilter } from "~/utils/economy-filters";
import { useTranslate } from "./app-context";
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

  function handleClick(filter: EconomyItemFilter) {
    return function handleClick() {
      onChange(filter);
    };
  }

  return (
    <div className="w-[186px] rounded-tr bg-black/10">
      {categories.map((filter, index) => {
        const isActive =
          filter.category === value.category && filter.type === value.type;
        const isIdle = !isActive;
        return (
          <button
            className={clsx(
              "flex w-full items-center justify-between gap-2 rounded-br rounded-tr px-4 py-1 text-left transition-all",
              isIdle && "group text-neutral-500 hover:text-neutral-300",
              isActive && "bg-black/20"
            )}
            key={index}
            onClick={handleClick(filter)}
          >
            <FontAwesomeIcon
              icon={faSquare}
              className={clsx("h-3 transition-all", isIdle && "opacity-0")}
            />
            <div className="min-w-0 flex-1 whitespace-nowrap">
              <TextSlider text={translate(`Category${filter.label}`)} />
            </div>
            <ItemPickerFilterIcon icon={filter.icon} className={clsx("h-4")} />
          </button>
        );
      })}
    </div>
  );
}
