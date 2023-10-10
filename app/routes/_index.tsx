import type { MetaFunction } from "@remix-run/node";
import { CS_Inventory, CS_Item, CS_MIN_BATTLE_SCARRED_FLOAT, CS_MIN_FIELD_TESTED_FLOAT, CS_MIN_FLOAT } from "cslib";
import { useEffect, useState } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" }
  ];
};

function getName(csItem: CS_Item) {
  if (csItem.type === "weapon") {
    const [weaponName, ...paintName] = csItem.name.split("|");
    return {
      model: weaponName.trim(),
      name: paintName.join("|")
    };
  }
  return {
    model: "@TODO",
    name: csItem.name
  };
}

export default function Index() {
  const [inventory, setInventory] = useState(
    new CS_Inventory([
      {
        id: 236
      },
      {
        id: 455
      },
      {
        id: 236
      },
      {
        id: 455
      },
      {
        id: 236
      },
      {
        id: 455
      },
      {
        id: 236
      },
      {
        id: 455
      }
    ])
  );

  const items = inventory.getAll().map(({ csItem, inventoryItem, index }) => {
    return {
      csItem,
      inventoryItem,
      index,
      ...getName(csItem)
    };
  });

  return (
    <div className="w-[1024px] m-auto flex my-8 gap-5 flex-wrap select-none">
      {items.map(({ csItem, inventoryItem, index, name, model }) => (
        <div key={index} className="hover:drop-shadow-lg">
          <div className="p-[1px] bg-gradient-to-b from-neutral-600 to-neutral-400">
            <div className="bg-gradient-to-b from-neutral-500 to-neutral-300 px-1">
              <img
                className="w-[144px] h-[108px]"
                src={CS_Inventory.resolveImage(inventoryItem, "/localimage")}
                draggable={false}
              />
            </div>
          </div>
          <div
            className="shadow shadow-black/50 w-full h-1"
            style={{ backgroundColor: csItem.rarity }}
          />
          <div className="text-[12px] leading-3 mt-2 text-white drop-shadow-[0_0_1px_rgba(0,0,0,1)]">
            <div className="font-bold">{model}</div>
            <div>{name}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
