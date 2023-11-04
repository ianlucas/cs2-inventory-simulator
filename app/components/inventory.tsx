/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Team } from "@ianlucas/cslib";
import { useMemo } from "react";
import { InventoryItem } from "~/components/inventory-item";
import { useSync } from "~/hooks/use-sync";
import { getFreeItemsToDisplay, sortByEquipped, sortByName, sortByType, transform } from "~/utils/inventory";
import { useRootContext } from "./root-context";

export function Inventory() {
  const { inventory, setInventory } = useRootContext();
  const sync = useSync();

  const items = useMemo(() =>
    inventory.getItems()
      .map(transform)
      .sort(sortByName)
      .sort(sortByType)
      .sort(sortByEquipped), [inventory]);

  const defaultItems = useMemo(() =>
    getFreeItemsToDisplay()
      .sort(sortByName)
      .sort(sortByType)
      .sort(sortByEquipped), []);

  function handleEquip(index: number, csTeam?: CS_Team) {
    setInventory(inventory => inventory.equip(index, csTeam));
    sync("equip", { index, csTeam });
  }

  function handleUnequip(index: number, csTeam?: CS_Team) {
    setInventory(inventory => inventory.unequip(index, csTeam));
    sync("unequip", { index, csTeam });
  }

  function handleDelete(index: number) {
    setInventory(inventory => inventory.remove(index));
    sync("remove", { index });
  }

  return (
    <div className="w-[1024px] m-auto flex my-8 gap-5 flex-wrap select-none">
      {items.map(item => (
        <InventoryItem
          key={item.index}
          {...item}
          onUnequip={handleUnequip}
          onEquip={handleEquip}
          onDelete={handleDelete}
        />
      ))}
      {defaultItems.map(item => (
        <InventoryItem
          key={item.index}
          {...item}
          readOnly
        />
      ))}
    </div>
  );
}
