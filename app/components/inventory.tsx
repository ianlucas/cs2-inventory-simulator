import { faSteam } from "@fortawesome/free-brands-svg-icons";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { CS_Inventory, CS_Team } from "cslib";
import { useMemo, useState } from "react";
import { HeaderLink } from "~/components/header-link";
import { InventoryItem } from "~/components/inventory-item";
import { sortByEquipped, sortByName, sortByType, transform } from "~/utils/inventory";

export function Inventory() {
  const [inventory, setInventory] = useState(
    new CS_Inventory([
      {
        id: 236,
        equippedT: true
      },
      {
        id: 455,
        equippedCT: true
      },
      {
        id: 1497,
        equippedCT: true,
        equippedT: true
      }
    ])
  );

  const items = useMemo(() =>
    inventory.getAll()
      .map(transform)
      .sort(sortByName)
      .sort(sortByType)
      .sort(sortByEquipped), [inventory]);

  function handleEquip(index: number, team?: CS_Team) {
    setInventory(inventory.equip(index, team));
  }

  function handleUnequip(index: number, team?: CS_Team) {
    setInventory(inventory.unequip(index, team));
  }

  function handleDelete(index: number) {
    setInventory(inventory.remove(index));
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
