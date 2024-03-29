/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useTranslation } from "~/hooks/use-translation";
import {
  INVENTORY_PRIMARY_FILTERS,
  INVENTORY_SECONDARY_FILTERS
} from "~/utils/inventory-filters";
import { InventoryFilterButton } from "./inventory-filter-button";
import { useRootContext } from "./root-context";

export function InventoryFilter() {
  const translate = useTranslation();
  const {
    inventoryFilters: {
      handleClickPrimary,
      handleClickSecondary,
      primary,
      secondaries
    }
  } = useRootContext();

  const secondaryFilters =
    INVENTORY_SECONDARY_FILTERS[INVENTORY_PRIMARY_FILTERS[primary]];
  const hasSecondaryFilters = secondaryFilters !== undefined;

  return (
    <div className="sticky left-0 top-16 z-20 hidden backdrop-blur lg:block">
      <div className="flex w-full items-center justify-center gap-2 bg-black/40 py-2">
        {INVENTORY_PRIMARY_FILTERS.map((value, index) => (
          <InventoryFilterButton
            active={index === primary}
            children={translate(`InventoryFilter${value}`)}
            key={value}
            onClick={handleClickPrimary(index)}
            shadowless
          />
        ))}
      </div>
      <div
        className="flex w-full items-center justify-center gap-2 overflow-hidden bg-gradient-to-b from-black/20 to-transparent transition-all"
        style={{
          height: hasSecondaryFilters ? 40 : 0,
          paddingTop: hasSecondaryFilters ? "0.375rem" : 0,
          paddingBottom: hasSecondaryFilters ? "0.375rem" : 0
        }}
      >
        {secondaryFilters?.map((value, index) => (
          <InventoryFilterButton
            active={secondaries[primary] === index}
            key={value}
            children={translate(`InventoryFilter${value}`)}
            onClick={handleClickSecondary(index)}
            shadowless
          />
        ))}
      </div>
    </div>
  );
}
