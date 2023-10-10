import { faSteam } from "@fortawesome/free-brands-svg-icons";
import { faCircleDot } from "@fortawesome/free-regular-svg-icons";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { MetaFunction } from "@remix-run/node";
import clsx from "clsx";
import { CS_Inventory, CS_Item, CS_MIN_BATTLE_SCARRED_FLOAT, CS_MIN_FIELD_TESTED_FLOAT, CS_MIN_FLOAT } from "cslib";
import { useEffect, useState } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "cstrike/inventory" },
    { name: "description", content: "Welcome to Remix!" }
  ];
};

function getName(csItem: CS_Item) {
  if (["weapon", "melee"].includes(csItem.type)) {
    const [weaponName, ...paintName] = csItem.name.split("|");
    return {
      model: (csItem.type === "melee" ? "★ " : "") + weaponName.trim(),
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

  const items = inventory.getAll().map(({ csItem, inventoryItem, index }) => {
    return {
      csItem,
      inventoryItem,
      index,
      equipped: [
        inventoryItem.equipped && "text-white",
        inventoryItem.equippedCT && "text-sky-300",
        inventoryItem.equippedT && "text-yellow-400"
      ],
      ...getName(csItem)
    };
  });

  return (
    <div>
      <div className="w-full bg-gradient-to-b drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
        <div className="w-[1024px] m-auto text-white py-4 flex items-center gap-8">
          <div className="font-bold select-none">cstrike/inventory</div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 hover:bg-black/30 active:bg-black/70 transition-all px-1.5 py-0.5">
              <FontAwesomeIcon className="h-4" icon={faPlus} />
              Craft Item
            </button>
            <button className="flex items-center gap-2">
              <FontAwesomeIcon className="h-4" icon={faSteam} />
              Sign-in
            </button>
          </div>
        </div>
      </div>
      <div className="w-[1024px] m-auto flex my-8 gap-5 flex-wrap select-none">
        {items.map((
          { csItem, inventoryItem, index, name, model, equipped }
        ) => (
          <div
            key={index}
            className="hover:drop-shadow-[0_0_5px_rgba(0,0,0,1)] transition-all"
          >
            <div className="p-[1px] bg-gradient-to-b from-neutral-600 to-neutral-400 relative">
              <div className="bg-gradient-to-b from-neutral-500 to-neutral-300 px-1">
                <img
                  className="w-[144px] h-[108px]"
                  src={CS_Inventory.resolveImage(inventoryItem, "/localimage")}
                  draggable={false}
                />
              </div>
              <div className="absolute right-0 top-0 p-2 flex items-center gap-1">
                {equipped.map((color, colorIndex) => (typeof color === "string"
                  ? (
                    <FontAwesomeIcon
                      key={colorIndex}
                      className={clsx("h-3.5 text-sky-300", color)}
                      icon={faCircleDot}
                    />
                  )
                  : null)
                )}
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
    </div>
  );
}
