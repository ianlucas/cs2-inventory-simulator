/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { EconomyItemFilter } from "~/shared/economy-filters";
import { useTranslate } from "./app-context";
import { ChipMenuItem } from "./chip-menu-item";

export function ItemPickerFilterMobile({
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
    <div className="flex flex-wrap gap-1 px-2">
      {categories.map((filter, index) => (
        <ChipMenuItem
          isActive={
            filter.loadoutCategory === value.loadoutCategory &&
            filter.type === value.type
          }
          key={index}
          label={translate(`Category${filter.label}`)}
          onClick={handleClick(filter)}
        />
      ))}
    </div>
  );
}
