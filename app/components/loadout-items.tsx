/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2InventoryItem } from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { useMemo } from "react";
import { getFreeItemsToDisplay } from "~/shared/inventory";
import { sortItems } from "~/shared/inventory-transform";
import { LoadoutTeam, getItemGroup, isUsableByTeam } from "~/shared/loadout";
import { useInventory } from "./app-context";
import { useEquipItemFilter } from "./hooks/use-item-hide-filters";
import { useLoadoutDrag } from "./hooks/use-loadout-drag";
import { InventoryItem } from "./inventory-item";
import type { LoadoutFilter } from "./loadout-items-filter";

export function LoadoutItems({
  filter,
  getDragSourceProps,
  onSelect,
  selectedUid,
  sorter,
  team
}: {
  filter: LoadoutFilter;
  getDragSourceProps: ReturnType<typeof useLoadoutDrag>["getDragSourceProps"];
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
        .map((item) => ({ equipped: [], item, uid: item.uid })),
      getFreeItemsToDisplay().filter(({ item }) => isListed(item))
    );
  }, [filter, inventory, isEquippable, sorter, team]);

  return (
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
  );
}
