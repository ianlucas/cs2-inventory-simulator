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
  const [model, name] = nameItem(item, "inventory-name");

  const currDate = getTimestamp();
  const isNew =
    inventoryItem?.updatedAt !== undefined &&
    currDate - inventoryItem.updatedAt < 120;

  return (
    <div className="w-38.5">
      <div className="group relative bg-linear-to-b from-neutral-600 to-neutral-400 p-px">
        <div className="bg-linear-to-b from-neutral-500 to-neutral-300 px-1">
          <ItemImage className="w-36" item={item} />
        </div>
        {isNew && (
          <div className="text-2.5 absolute top-px left-px bg-sky-600 p-1 font-bold text-sky-200 shadow-lg transition-all group-hover:text-white">
            {translate("InventoryItemNew")}
          </div>
        )}
        {inventoryItem?.stickers !== undefined && (
          <div className="absolute bottom-0 left-0 flex items-center p-1">
            {inventoryItem.someStickers().map(([slot, { id }]) => (
              <ItemImage
                className="h-5"
                item={CS2Economy.getById(id)}
                key={slot}
              />
            ))}
          </div>
        )}
        {inventoryItem?.patches !== undefined && (
          <div className="absolute bottom-0 left-0 flex items-center p-1">
            {inventoryItem.somePatches().map(([slot, id]) => (
              <ItemImage
                className="h-5"
                item={CS2Economy.getById(id)}
                key={slot}
              />
            ))}
          </div>
        )}
        {equipped !== undefined && (
          <div className="absolute top-0 right-0 flex items-center gap-1 p-2">
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
            className="absolute top-0 left-0 size-full border-4 border-transparent transition-all hover:border-white"
            onClick={onClick}
          />
        )}
      </div>
      <div
        className="h-1 shadow-sm shadow-black/50"
        style={{ backgroundColor: item.rarity }}
      />
      <div className="font-display text-3/3 mt-1 wrap-break-word text-white drop-shadow-[0_0_1px_rgba(0,0,0,1)]">
        {has(model) && <div className="font-bold">{model}</div>}
        {has(name) && <div>{name}</div>}
      </div>
    </div>
  );
}
