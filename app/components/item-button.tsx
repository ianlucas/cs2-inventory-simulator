/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem } from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { useNameItem } from "~/components/hooks/use-name-item";
import { isNewItem } from "~/shared/economy";
import { usePreferences, useTranslate } from "./app-context";
import { ItemImage } from "./item-image";
import { Marquee } from "./marquee";

export function ItemButton({
  bigger,
  ignoreRarityColor,
  index,
  item,
  onClick
}: {
  bigger?: boolean;
  ignoreRarityColor?: boolean;
  index?: number;
  item: CS2EconomyItem;
  onClick?: (item: CS2EconomyItem) => void;
}) {
  const translate = useTranslate();
  const { hideNewItemLabel } = usePreferences();
  const nameItem = useNameItem();
  const [model, name] = nameItem(item, "editor-name");
  const clickable = onClick !== undefined;
  const showAltname =
    item.alternateName !== undefined &&
    (item.alternateName.includes("Collectible") ||
      item.alternateName.includes("Commodity") ||
      item.isPaintable());

  function handleClick() {
    if (onClick) {
      onClick(item);
    }
  }

  return (
    <button
      onClick={handleClick}
      className={clsx(
        "font-display",
        (index ?? 0) % 2 !== 0 ? "bg-black/10" : "bg-transparent",
        clickable &&
          "relative cursor-default overflow-hidden hover:bg-black/25 active:bg-black/30",
        !bigger && "block h-16 w-full pr-4 pl-0.5",
        bigger && "flex size-full items-center justify-center"
      )}
    >
      <div
        className={clsx(
          "group relative truncate",
          !bigger && "flex items-center"
        )}
      >
        <ItemImage
          className={clsx(
            "overflow-hidden drop-shadow-[0_0_1px_rgba(0,0,0,1)]",
            !bigger && "w-20.5",
            bigger && "m-auto h-32"
          )}
          item={item}
          lazy
          key={item.imagePath}
        />
        <div
          className={clsx(
            "w-0 min-w-0 flex-1 text-left drop-shadow-[0_0_1px_rgba(0,0,0,1)]",
            !bigger && "ml-4"
          )}
        >
          {model !== "" && (
            <div className="text-xs/3 text-neutral-400">
              <Marquee>{model}</Marquee>
            </div>
          )}
          <div
            style={{ color: ignoreRarityColor ? undefined : item.rarityColor }}
          >
            <Marquee>{name}</Marquee>
          </div>
          {showAltname && item.alternateName !== undefined && (
            <Marquee className="text-sm/3 text-neutral-200">
              {item.alternateName}
            </Marquee>
          )}
        </div>
        {!hideNewItemLabel && isNewItem(item) && (
          <div
            className="absolute bottom-1.5 left-1.5 animate-pulse rounded text-[0.5rem] font-bold uppercase"
            children={translate("InventoryItemNew")}
          />
        )}
      </div>
    </button>
  );
}
