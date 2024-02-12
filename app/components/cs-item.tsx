/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faCircleDot } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CS_Economy, CS_Item, CS_NO_STICKER } from "@ianlucas/cslib";
import clsx from "clsx";
import { useTranslation } from "~/hooks/use-translation";
import { getCSItemName, resolveItemImage } from "~/utils/economy";
import { CSItemImage } from "./cs-item-image";

export function CSItem({
  item,
  equipped,
  nametag,
  onClick,
  stattrak,
  stickers,
  wear
}: {
  item: CS_Item;
  equipped?: (string | false | undefined)[];
  nametag?: string;
  onClick?: () => void;
  stattrak?: number;
  stickers?: number[];
  wear?: number;
}) {
  const translate = useTranslation();
  const { model, name } = getCSItemName(item);
  const hasModel = model || stattrak !== undefined;

  return (
    <div className="w-[154px]">
      <div className="relative bg-gradient-to-b from-neutral-600 to-neutral-400 p-[1px]">
        <div className="bg-gradient-to-b from-neutral-500 to-neutral-300 px-1">
          <CSItemImage
            className="h-[108px] w-[144px]"
            item={item}
            wear={wear}
          />
        </div>
        <div className="absolute bottom-0 left-0 flex items-center p-1">
          {stickers !== undefined &&
            stickers.map(
              (sticker, index) =>
                sticker !== CS_NO_STICKER && (
                  <CSItemImage
                    className="h-5"
                    item={CS_Economy.getById(sticker)}
                    key={index}
                  />
                )
            )}
        </div>
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
        style={{ backgroundColor: item.rarity }}
      />
      <div className="mt-2 text-[12px] leading-3 text-white drop-shadow-[0_0_1px_rgba(0,0,0,1)]">
        {nametag !== undefined ? (
          <>"{nametag}"</>
        ) : (
          <>
            {hasModel && (
              <div className="font-bold">
                {stattrak !== undefined && "StatTrak™ "}
                {translate(`Model${model}`, model)}
              </div>
            )}
            <div className={clsx(!hasModel && "font-bold")}>{name}</div>
          </>
        )}
      </div>
    </div>
  );
}
