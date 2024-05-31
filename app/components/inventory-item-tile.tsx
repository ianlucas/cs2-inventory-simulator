/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faCircleDot } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS2Economy,
  CS2EconomyItem,
  CS2InventoryItem,
  getTimestamp
} from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { useNameItem } from "~/components/hooks/use-name-item";
import { has } from "~/utils/misc";
import { useTranslate } from "./app-context";
import { ItemImage } from "./item-image";

export function InventoryItemTile({
  equipped,
  item,
  onClick
}: {
  equipped?: (string | false | undefined)[];
  item: CS2EconomyItem | CS2InventoryItem;
  onClick?: () => void;
}) {
  const translate = useTranslate();
  const nameItem = useNameItem();
  const inventoryItem = item instanceof CS2InventoryItem ? item : undefined;
  const data = item;
  const [model, name] = nameItem(item, "inventory-name");

  const currDate = getTimestamp();
  const isNew =
    inventoryItem?.updatedAt !== undefined &&
    currDate - inventoryItem.updatedAt < 120;

  return (
    <div className="w-[154px]">
      <div className="group relative bg-gradient-to-b from-neutral-600 to-neutral-400 p-[1px]">
        <div className="bg-gradient-to-b from-neutral-500 to-neutral-300 px-1">
          <ItemImage
            className="h-[108px] w-[144px]"
            item={data}
            wear={inventoryItem?.wear}
          />
        </div>
        {isNew && (
          <div className="absolute left-[1px] top-[1px] bg-sky-600 px-1 py-1 text-[10px] font-bold text-sky-200 shadow-lg transition-all group-hover:text-white">
            {translate("InventoryItemNew")}
          </div>
        )}
        {inventoryItem?.stickers !== undefined && (
          <div className="absolute bottom-0 left-0 flex items-center p-1">
            {Object.entries(inventoryItem.stickers).map(([index, { id }]) => (
              <ItemImage
                className="h-5"
                item={CS2Economy.getById(id)}
                key={index}
              />
            ))}
          </div>
        )}
        {equipped !== undefined && (
          <div className="absolute right-0 top-0 flex items-center gap-1 p-2">
            {equipped.map((color, colorIndex) =>
              typeof color === "string" ? (
                <FontAwesomeIcon
                  key={colorIndex}
                  className={clsx("h-3.5 text-sky-300", color)}
                  icon={faCircleDot}
                />
              ) : null
            )}
          </div>
        )}
        {onClick !== undefined && (
          <button
            className="absolute left-0 top-0 h-full w-full border-4 border-transparent transition-all hover:border-white"
            onClick={onClick}
          />
        )}
      </div>
      <div
        className="h-1 shadow shadow-black/50"
        style={{ backgroundColor: data.rarity }}
      />
      <div className="mt-2 text-[12px] leading-3 text-white drop-shadow-[0_0_1px_rgba(0,0,0,1)]">
        {has(model) && <div className="font-bold">{model}</div>}
        {has(name) && <div>{name}</div>}
      </div>
    </div>
  );
}
