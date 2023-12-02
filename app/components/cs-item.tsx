/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faCircleDot } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CS_Economy, CS_Item, CS_resolveItemImage } from "@ianlucas/cslib";
import clsx from "clsx";
import { useTranslation } from "~/hooks/use-translation";
import { baseUrl, getCSItemName } from "~/utils/economy";

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
  onClick?(): void;
  stattrak?: number;
  stickers?: (number | null)[];
  wear?: number;
}) {
  const translate = useTranslation();
  const { model, name } = getCSItemName(item);
  const hasModel = model || stattrak !== undefined;

  return (
    <div className="w-[154px]">
      <div className="p-[1px] bg-gradient-to-b from-neutral-600 to-neutral-400 relative">
        <div className="bg-gradient-to-b from-neutral-500 to-neutral-300 px-1">
          <img
            className="w-[144px] h-[108px]"
            src={CS_resolveItemImage(
              baseUrl,
              item,
              wear
            )}
            draggable={false}
            alt={item.name}
          />
        </div>
        <div className="absolute left-0 bottom-0 p-1 flex items-center">
          {stickers !== undefined
            && stickers.map(
              (sticker, index) =>
                sticker !== null && (
                  <img
                    key={index}
                    className="h-5"
                    src={CS_Economy.getById(sticker).image}
                    alt={CS_Economy.getById(sticker).name}
                  />
                )
            )}
        </div>
        {equipped !== undefined && (
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
        )}
        {onClick !== undefined && (
          <button
            className="transition-all border-4 border-transparent hover:border-white absolute left-0 top-0 w-full h-full"
            onClick={onClick}
          />
        )}
      </div>
      <div
        className="shadow shadow-black/50 h-1"
        style={{ backgroundColor: item.rarity }}
      />
      <div className="text-[12px] leading-3 mt-2 text-white drop-shadow-[0_0_1px_rgba(0,0,0,1)]">
        {nametag !== undefined
          ? <>"{nametag}"</>
          : (
            <>
              {hasModel && (
                <div className="font-bold">
                  {stattrak !== undefined && "StatTrak™ "}
                  {translate(`Model${model}`, model)}
                </div>
              )}
              <div className={clsx(!hasModel && "font-bold")}>
                {name}
              </div>
            </>
          )}
      </div>
    </div>
  );
}
