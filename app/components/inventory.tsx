/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Team } from "@ianlucas/cslib";
import { ReactNode, useMemo } from "react";
import { InventoryItem } from "~/components/inventory-item";
import { useSync } from "~/hooks/use-sync";
import { getFreeItemsToDisplay, sortByEquipped, sortByName, sortByType, transform } from "~/utils/inventory";
import { useRootContext } from "./root-context";

export function Inventory() {
  const { inventory, setInventory, language } = useRootContext();
  const sync = useSync();

  const items = useMemo(() =>
    inventory.getItems()
      .map(transform)
      .sort(sortByName)
      .sort(sortByType)
      .sort(sortByEquipped), [inventory, language]);

  const defaultItems = useMemo(() =>
    getFreeItemsToDisplay()
      .sort(sortByName)
      .sort(sortByType)
      .sort(sortByEquipped), [language]);

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
    <div className="w-full px-2 lg:px-0 lg:w-[1024px] m-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 lg:my-8 gap-2 lg:gap-5 select-none">
      {items.map(item => (
        <InventoryItemWrapper key={item.index}>
          <InventoryItem
            {...item}
            onUnequip={handleUnequip}
            onEquip={handleEquip}
            onDelete={handleDelete}
          />
        </InventoryItemWrapper>
      ))}
      {defaultItems.map(item => (
        <InventoryItemWrapper key={item.index}>
          <InventoryItem
            {...item}
            readOnly
          />
        </InventoryItemWrapper>
      ))}
    </div>
  );
}

function InventoryItemWrapper({
  children
}: {
  children: ReactNode;
}) {
  return (
    <div>
      <div className="w-full h-full flex items-center justify-center lg:w-auto lg:h-auto lg:block">
        {children}
      </div>
    </div>
  );
}
