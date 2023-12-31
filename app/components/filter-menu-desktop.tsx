/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { useTranslation } from "~/hooks/use-translation";
import { ITEM_FILTERS, ItemFiltersItem } from "~/utils/economy-item-filters";
import { TextSlider } from "./text-slider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faSquare } from "@fortawesome/free-solid-svg-icons";

export function FilterMenuDesktop({
  onChange,
  value
}: {
  onChange(newValue: ItemFiltersItem): void;
  value: ItemFiltersItem;
}) {
  const translate = useTranslation();

  function handleClick(filter: ItemFiltersItem) {
    return function handleClick() {
      onChange(filter);
    };
  }

  return (
    <div className="w-[160px]">
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
            <img
              draggable={false}
              alt={translate(`Category${filter.label}`)}
              src={`/icons/${filter.icon}.svg`}
              className={clsx(
                "h-4 transition-all",
                isIdle && "opacity-30 group-hover:opacity-50"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
