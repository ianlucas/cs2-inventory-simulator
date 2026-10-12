/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2Economy,
  CS2InventoryItem,
  CS2ItemType,
  ensure
} from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { useMemo } from "react";
import { getFreeItemsToDisplay } from "~/shared/inventory";
import { INVENTORY_SORTERS } from "~/shared/inventory-filters";
import { sortItems } from "~/shared/inventory-transform";
import {
  LOADOUT_GROUPS,
  LoadoutGroup,
  LoadoutTeam,
  getItemGroup,
  isUsableByTeam
} from "~/shared/loadout";
import {
  LOADOUT_GROUP_LABELS,
  LOADOUT_WEAPON_GROUP_ALL_LABELS
} from "~/shared/loadout-labels";
import { useInventory, useTranslate } from "./app-context";
import { useEquipItemFilter } from "./hooks/use-item-hide-filters";
import { useLoadoutDrag } from "./hooks/use-loadout-drag";
import { InventoryItem } from "./inventory-item";
import { LoadoutIcon } from "./loadout-icon";
import { Select } from "./select";

export interface LoadoutFilter {
  group: "all" | LoadoutGroup;
  modelKey: string;
}

const LOADOUT_SORTERS = INVENTORY_SORTERS.filter(
  ({ value }) => value !== "equipped"
);

export function LoadoutItems({
  filter,
  getDragSourceProps,
  onChangeFilter,
  onChangeSorter,
  onSelect,
  selectedUid,
  sorter,
  team
}: {
  filter: LoadoutFilter;
  getDragSourceProps: ReturnType<typeof useLoadoutDrag>["getDragSourceProps"];
  onChangeFilter: (filter: LoadoutFilter) => void;
  onChangeSorter: (sorter: string) => void;
  onSelect: (item: CS2InventoryItem) => void;
  selectedUid?: number;
  sorter: string;
  team: LoadoutTeam;
}) {
  const translate = useTranslate();
  const [inventory] = useInventory();
  const isEquippable = useEquipItemFilter();

  const items = useMemo(() => {
    function isListed(item: CS2InventoryItem) {
      const group = getItemGroup(item);
      return (
        group !== undefined &&
        isUsableByTeam(item, team) &&
        isEquippable(item) &&
        !item.isSealed() &&
        (filter.group === "all" || filter.group === group) &&
        (filter.modelKey === "all" || filter.modelKey === item.modelKey)
      );
    }
    return sortItems(
      sorter,
      inventory
        .getAll()
        .filter(isListed)
        .map((item) => ({ equipped: [], item, uid: item.uid })),
      getFreeItemsToDisplay().filter(({ item }) => isListed(item))
    );
  }, [filter, inventory, isEquippable, sorter, team]);

  const allWeaponsLabel =
    filter.group !== "all"
      ? LOADOUT_WEAPON_GROUP_ALL_LABELS[filter.group]
      : undefined;
  const weaponOptions =
    allWeaponsLabel !== undefined
      ? [
          { label: translate(allWeaponsLabel), value: "all" },
          ...CS2Economy.filterItems({
            isDefault: true,
            type: CS2ItemType.Weapon
          })
            .filter(
              (item) =>
                getItemGroup(item) === filter.group &&
                isUsableByTeam(item, team)
            )
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((item) => ({ label: item.name, value: ensure(item.modelKey) }))
        ]
      : undefined;

  return (
    <div className="font-display">
      <div className="flex items-center gap-2 py-2">
        <LoadoutIcon
          className="mx-2 size-4 text-white"
          src="/images/vectors/filter.svg"
        />
        <Select
          children={({ label }) => <span className="text-sm">{label}</span>}
          className="min-w-38"
          grayscale
          noMaxHeight
          onChange={(group) =>
            onChangeFilter({
              group: group as LoadoutFilter["group"],
              modelKey: "all"
            })
          }
          options={(["all", ...LOADOUT_GROUPS] as const).map((group) => ({
            label: translate(LOADOUT_GROUP_LABELS[group]),
            value: group
          }))}
          value={filter.group}
        />
        {weaponOptions !== undefined && (
          <Select
            children={({ label }) => <span className="text-sm">{label}</span>}
            className="min-w-38"
            grayscale
            noMaxHeight
            onChange={(modelKey) =>
              onChangeFilter({ group: filter.group, modelKey })
            }
            options={weaponOptions}
            value={filter.modelKey}
          />
        )}
        {filter.group !== "all" && (
          <button
            className="flex items-center rounded-sm bg-white/5 p-1.5 text-white hover:bg-black/40"
            onClick={() => onChangeFilter({ group: "all", modelKey: "all" })}
            title={translate("LoadoutClearFilters")}
          >
            <LoadoutIcon className="size-4" src="/images/vectors/cancel.svg" />
          </button>
        )}
        <div className="flex-1" />
        <LoadoutIcon
          className="mx-2 size-4 text-white"
          src="/images/vectors/sort.svg"
        />
        <Select
          children={({ label }) => <span className="text-sm">{label}</span>}
          className="min-w-38"
          grayscale
          noMaxHeight
          onChange={onChangeSorter}
          options={LOADOUT_SORTERS.map(({ label, value }) => ({
            label: translate(`InventoryFilter${label}`),
            value
          }))}
          value={sorter}
        />
      </div>
      <div className="grid grid-cols-6 gap-x-5 gap-y-4 py-4">
        {items.map(({ equipped, item, uid }) => (
          <div
            className={clsx(
              "flex justify-center",
              selectedUid === uid && "outline-2 outline-offset-2 outline-white"
            )}
            key={uid}
            {...getDragSourceProps(item)}
          >
            <InventoryItem
              disableContextMenu
              draggable
              equipped={equipped}
              item={item}
              onClick={() => onSelect(item)}
              uid={uid}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
