import { faSteam } from "@fortawesome/free-brands-svg-icons";
import { faCircleDot } from "@fortawesome/free-regular-svg-icons";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { MetaFunction } from "@remix-run/node";
import clsx from "clsx";
import { CS_Economy, CS_Inventory, CS_Item, CS_MIN_BATTLE_SCARRED_FLOAT, CS_MIN_FIELD_TESTED_FLOAT, CS_MIN_FLOAT } from "cslib";
import { useEffect, useState } from "react";
import { HeaderButton } from "~/components/header-button";
import { InventoryItem } from "~/components/inventory-item";
import { transform } from "~/utils/inventory";

export const meta: MetaFunction = () => {
  return [
    { title: "cstrike/inventory" },
    { name: "description", content: "Welcome to Remix!" }
  ];
};

export default function Index() {
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

  const items = inventory.getAll().map(transform);

  return (
    <div>
      <div className="w-full bg-gradient-to-b drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
        <div className="w-[1024px] m-auto text-white py-4 flex items-center gap-8">
          <div className="font-bold select-none">cstrike/inventory</div>
          <div className="flex items-center gap-2">
            <HeaderButton icon={faPlus} label="Craft Item" />
            <HeaderButton icon={faSteam} label="Sign-in to sync" />
          </div>
        </div>
      </div>
      <div className="w-[1024px] m-auto flex my-8 gap-5 flex-wrap select-none">
        {items.map(item => <InventoryItem key={item.index} {...item} />)}
      </div>
    </div>
  );
}
