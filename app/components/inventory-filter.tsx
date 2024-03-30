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
import { useTranslation } from "~/hooks/use-translation";
import {
  INVENTORY_PRIMARY_FILTERS,
  INVENTORY_SECONDARY_FILTERS,
  INVENTORY_SORTERS
} from "~/utils/inventory-filters";
import { InventoryFilterButton } from "./inventory-filter-button";
import { useRootContext } from "./root-context";
import { Select } from "./select";

export function InventoryFilter() {
  const translate = useTranslation();
  const {
    inventoryFilters: {
      handleClickPrimary,
      handleClickSecondary,
      primary,
      search,
      secondaries,
      setSearch,
      setSorter,
      sorter
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
      <div className="m-auto flex w-[1024px] items-center py-1.5">
        <div className="flex-1">
          <div className="group flex w-[320px] items-center gap-4">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-white" />
            <input
              className={clsx(
                "flex-1 border-b-2 border-white bg-transparent placeholder-neutral-400 outline-none transition-all",
                search.length === 0 && "opacity-0 group-hover:opacity-100"
              )}
              onChange={setSearch}
              placeholder={translate("InventoryFilterSearch")}
              value={search}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <FontAwesomeIcon
            className="h-4 text-white"
            icon={faArrowDownWideShort}
          />
          <Select
            children={({ label }) => <span className="text-sm">{label}</span>}
            className="min-w-[200px]"
            noMaxHeight
            onChange={setSorter}
            options={INVENTORY_SORTERS.map(({ label, value }) => ({
              label: translate(`InventoryFilter${label}`),
              value
            }))}
            value={sorter}
          />
        </div>
      </div>
    </div>
  );
}
