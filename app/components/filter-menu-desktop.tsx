/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { useTranslation } from "~/hooks/use-translation";
import { ITEM_FILTERS, ItemFilter } from "~/utils/filters";
import { FilterMenuIcon } from "./filter-menu-icon";
import { TextSlider } from "./text-slider";

export function FilterMenuDesktop({
  onChange,
  value
}: {
  onChange: (newValue: ItemFilter) => void;
  value: ItemFilter;
}) {
  const translate = useTranslation();

  function handleClick(filter: ItemFilter) {
    return function handleClick() {
      onChange(filter);
    };
  }

  return (
    <div className="w-[186px] rounded-tr bg-black/10">
      {ITEM_FILTERS.map((filter, index) => {
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
            <FilterMenuIcon icon={filter.icon} className={clsx("h-4")} />
          </button>
        );
      })}
    </div>
  );
}
