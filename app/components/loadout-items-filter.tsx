/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, CS2ItemType, ensure } from "@ianlucas/cs2-lib";
import { INVENTORY_SORTERS } from "~/shared/inventory-filters";
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
import { useTranslate } from "./app-context";
import { LoadoutIcon } from "./loadout-icon";
import { Select } from "./select";

export interface LoadoutFilter {
  group: "all" | LoadoutGroup;
  modelKey: string;
}

const LOADOUT_SORTERS = INVENTORY_SORTERS.filter(
  ({ value }) => value !== "equipped"
);

export function LoadoutItemsFilter({
  filter,
  onChangeFilter,
  onChangeSorter,
  sorter,
  team
}: {
  filter: LoadoutFilter;
  onChangeFilter: (filter: LoadoutFilter) => void;
  onChangeSorter: (sorter: string) => void;
  sorter: string;
  team: LoadoutTeam;
}) {
  const translate = useTranslate();

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
    <div className="font-display flex items-center gap-2 py-2">
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
  );
}
