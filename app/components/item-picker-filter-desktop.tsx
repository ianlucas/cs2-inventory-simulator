/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { EconomyItemFilter } from "~/utils/economy-filters";
import { useLocalize } from "./app-context";
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
  const localize = useLocalize();

  function handleClick(filter: EconomyItemFilter) {
    return function handleClick() {
      onChange(filter);
    };
  }

  return (
    <div className="flex w-[220px]">
      <div className="w-full rounded-br rounded-tr bg-black/10 py-1.5">
        {categories.map((filter, index) => {
          const isActive =
            filter.category === value.category && filter.type === value.type;
          const isIdle = !isActive;
          return (
            <button
              className={clsx(
                "flex w-full items-center justify-between gap-2 px-4 py-1 text-left transition-all",
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
              <div className="min-w-0 flex-1 whitespace-nowrap font-display font-bold">
                <TextSlider text={localize(`Category${filter.label}`)} />
              </div>
              <ItemPickerFilterIcon
                icon={filter.icon}
                className={clsx(
                  "h-4 transition-all",
                  isActive ? "translate-x-0 scale-125" : "-translate-x-2"
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
