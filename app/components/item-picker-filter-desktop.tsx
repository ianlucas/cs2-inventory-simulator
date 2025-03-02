/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

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
    <div className="flex max-w-[220px] min-w-[168px]">
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
            </button>
          );
        })}
      </div>
    </div>
  );
}
