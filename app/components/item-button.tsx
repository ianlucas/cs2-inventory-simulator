/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem } from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { useNameItem } from "~/components/hooks/use-name-item";
import { ItemImage } from "./item-image";
import { TextSlider } from "./text-slider";

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
  const nameItem = useNameItem();
  const [model, name] = nameItem(item, "editor-name");
  const clickable = onClick !== undefined;
  const showAltname =
    item.altName !== undefined &&
    (item.altName.includes("Collectible") ||
      item.altName.includes("Commodity") ||
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
        !bigger && "block h-[64px] w-full pr-4 pl-[2px]",
        bigger && "flex h-full w-full items-center justify-center"
      )}
    >
      <div
        className={clsx(
          "group overflow-hidden text-ellipsis whitespace-nowrap",
          !bigger && "flex items-center"
        )}
      >
        <ItemImage
          className={clsx(
            "overflow-hidden drop-shadow-[0_0_1px_rgba(0,0,0,1)]",
            !bigger && "aspect-[1.333] w-[82px]",
            bigger && "m-auto h-32"
          )}
          item={item}
          key={item.image}
        />
        <div
          className={clsx(
            "w-0 min-w-0 flex-1 text-left drop-shadow-[0_0_1px_rgba(0,0,0,1)]",
            !bigger && "ml-4"
          )}
        >
          <div className="text-xs leading-3 text-neutral-400">
            <TextSlider text={model} />
          </div>
          <div style={{ color: ignoreRarityColor ? undefined : item.rarity }}>
            <TextSlider text={name} />
          </div>
          {showAltname && item.altName !== undefined && (
            <TextSlider
              className="text-sm leading-3 text-neutral-200"
              text={item.altName}
            />
          )}
        </div>
      </div>
    </button>
  );
}
