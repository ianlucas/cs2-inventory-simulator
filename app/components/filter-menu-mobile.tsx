/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { useCraftFilterRules } from "~/hooks/use-craft-filter-rules";
import { useTranslation } from "~/hooks/use-translation";
import { CRAFT_ITEM_FILTERS, CraftItemFilter } from "~/utils/craft-filters";

export function FilterMenuMobile({
  onChange,
  value
}: {
  onChange: (newValue: CraftItemFilter) => void;
  value: CraftItemFilter;
}) {
  const filter = useCraftFilterRules();
  const translate = useTranslation();

  function handleClick(filter: CraftItemFilter) {
    return function handleClick() {
      onChange(filter);
    };
  }

  return (
    <div className="flex flex-wrap gap-1 px-2">
      {CRAFT_ITEM_FILTERS.filter(filter).map((filter, index) => (
        <button
          key={index}
          className={clsx(
            "rounded bg-opacity-50 px-2 transition-all hover:text-neutral-200",
            !(
              filter.category === value.category && filter.type === value.type
            ) && "text-neutral-400",
            filter.category === value.category &&
              filter.type === value.type &&
              "bg-black/50 text-neutral-200"
          )}
          onClick={handleClick(filter)}
        >
          {translate(`Category${filter.label}`)}
        </button>
      ))}
    </div>
  );
}
