/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2InventoryItem } from "@ianlucas/cs2-lib";
import { useMemo } from "react";
import { getFreeItemsToDisplay } from "~/shared/inventory";
import { getEquippedColors, sortItems } from "~/shared/inventory-transform";
import {
  Loadout,
  LoadoutTeam,
  getItemGroup,
  getLoadoutItemEquipped,
  isUsableByTeam
} from "~/shared/loadout";
import { useInventory } from "./app-context";
import { useEquipItemFilter } from "./hooks/use-item-hide-filters";
import { useLoadoutDrag } from "./hooks/use-loadout-drag";
import { InventoryItem } from "./inventory-item";
import type { LoadoutFilter } from "./loadout-items-filter";

export function LoadoutItems({
  filter,
  getDragSourceProps,
  isReadOnly,
  loadout,
  onSelect,
  selectedUid,
  sorter,
  team
}: {
  filter: LoadoutFilter;
  getDragSourceProps: ReturnType<typeof useLoadoutDrag>["getDragSourceProps"];
  isReadOnly: boolean;
  loadout?: Loadout;
  onSelect: (item: CS2InventoryItem) => void;
  selectedUid?: number;
  sorter: string;
  team: LoadoutTeam;
}) {
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
        .map((item) => ({
          equipped:
            loadout !== undefined
              ? getEquippedColors(getLoadoutItemEquipped(loadout, item.uid))
              : [],
          item,
          uid: item.uid
        })),
      getFreeItemsToDisplay().filter(({ item }) => isListed(item))
    );
  }, [filter, inventory, isEquippable, loadout, sorter, team]);

  return (
    <div className="grid grid-cols-6 gap-x-5 gap-y-4 py-4">
      {items.map(({ equipped, item, uid }) => (
        <div
          className="flex justify-center"
          key={uid}
          {...(isReadOnly ? {} : getDragSourceProps(item))}
        >
          <InventoryItem
            disableContextMenu
            draggable={!isReadOnly}
            equipped={equipped}
            item={item}
            onClick={isReadOnly ? undefined : () => onSelect(item)}
            selected={selectedUid === uid}
            uid={uid}
          />
        </div>
      ))}
    </div>
  );
}
