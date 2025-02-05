/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  faArrowDownWideShort,
  faMagnifyingGlass
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import {
  INVENTORY_PRIMARY_FILTERS,
  INVENTORY_SECONDARY_FILTERS,
  INVENTORY_SORTERS
} from "~/utils/inventory-filters";
import { useInventoryFilter, useLocalize } from "./app-context";
import { InventoryFilterButton } from "./inventory-filter-button";
import { Select } from "./select";

export function InventoryFilter() {
  const localize = useLocalize();
  const {
    handlePrimaryClick,
    handleSecondaryClick,
    primaryIndex,
    search,
    secondaryIndexes,
    setSearch,
    setSorter,
    sorter
  } = useInventoryFilter();

  const secondaryFilters =
    INVENTORY_SECONDARY_FILTERS[INVENTORY_PRIMARY_FILTERS[primaryIndex]];
  const hasSecondaryFilters = secondaryFilters !== undefined;

  return (
    <div className="hidden lg:block">
      <div className="mx-auto flex w-[1024px] items-center justify-center gap-2 rounded-t bg-neutral-900/30 py-2">
        {INVENTORY_PRIMARY_FILTERS.map((value, index) => (
          <InventoryFilterButton
            active={index === primaryIndex}
            children={localize(`InventoryFilter${value}`)}
            key={value}
            onClick={handlePrimaryClick(index)}
            shadowless
          />
        ))}
      </div>
      <div
        className="mx-auto flex w-[1024px] items-center justify-center gap-2 overflow-hidden bg-linear-to-b from-black/20 to-transparent transition-all"
        style={{
          height: hasSecondaryFilters ? 40 : 0,
          paddingTop: hasSecondaryFilters ? "0.375rem" : 0,
          paddingBottom: hasSecondaryFilters ? "0.375rem" : 0
        }}
      >
        {secondaryFilters?.map((value, index) => (
          <InventoryFilterButton
            active={secondaryIndexes[primaryIndex] === index}
            key={value}
            children={localize(`InventoryFilter${value}`)}
            onClick={handleSecondaryClick(index)}
            shadowless
          />
        ))}
      </div>
      <div className="m-auto flex w-[1024px] items-center py-1.5">
        <div className="flex-1">
          <div className="group flex w-[320px] items-center gap-4">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="h-4 text-white"
            />
            <input
              className={clsx(
                "flex-1 border-b-2 border-white bg-transparent placeholder-neutral-400 outline-hidden transition-all",
                search.length === 0 &&
                  "opacity-0 group-hover:opacity-100 focus:opacity-100"
              )}
              onChange={setSearch}
              placeholder={localize("InventoryFilterSearch")}
              value={search}
            />
          </div>
        </div>
        <div className="font-display flex items-center gap-3">
          <FontAwesomeIcon
            className="h-4 text-white"
            icon={faArrowDownWideShort}
          />
          <Select
            children={({ label }) => <span className="text-sm">{label}</span>}
            className="min-w-[200px]"
            grayscale
            noMaxHeight
            onChange={setSorter}
            options={INVENTORY_SORTERS.map(({ label, value }) => ({
              label: localize(`InventoryFilter${label}`),
              value
            }))}
            value={sorter}
          />
        </div>
      </div>
    </div>
  );
}
