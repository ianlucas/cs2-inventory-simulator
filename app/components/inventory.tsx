import { CS_Team } from "cslib";
import { useMemo } from "react";
import { InventoryItem } from "~/components/inventory-item";
import { useSync } from "~/hooks/use-sync";
import { sortByEquipped, sortByName, sortByType, transform } from "~/utils/inventory";
import { useRootContext } from "./root-context";

export function Inventory() {
  const { inventory, setInventory } = useRootContext();
  const sync = useSync();

  const items = useMemo(() =>
    inventory.getAll()
      .map(transform)
      .sort(sortByName)
      .sort(sortByType)
      .sort(sortByEquipped), [inventory]);

  function handleEquip(index: number, csTeam?: CS_Team) {
    setInventory(inventory => inventory.equip(index, csTeam));
  }

  function handleUnequip(index: number, csTeam?: CS_Team) {
    setInventory(inventory => inventory.unequip(index, csTeam));
  }

  function handleDelete(index: number) {
    setInventory(inventory => inventory.remove(index));
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
    </div>
  );
}
