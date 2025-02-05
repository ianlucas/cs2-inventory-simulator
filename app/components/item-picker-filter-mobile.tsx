/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { EconomyItemFilter } from "~/utils/economy-filters";
import { useLocalize } from "./app-context";

export function ItemPickerFilterMobile({
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
    <div className="flex flex-wrap gap-1 px-2">
      {categories.map((filter, index) => (
        <button
          key={index}
          className={clsx(
            "font-display rounded-sm px-2 font-bold transition-all hover:text-neutral-200",
            !(
              filter.category === value.category && filter.type === value.type
            ) && "text-neutral-400",
            filter.category === value.category &&
              filter.type === value.type &&
              "bg-black/50 text-neutral-200"
          )}
          onClick={handleClick(filter)}
        >
          {localize(`Category${filter.label}`)}
        </button>
      ))}
    </div>
  );
}
