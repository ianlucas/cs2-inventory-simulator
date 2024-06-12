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
  item,
  onClick
}: {
  bigger?: boolean;
  ignoreRarityColor?: boolean;
  item: CS2EconomyItem;
  onClick?: (item: CS2EconomyItem) => void;
}) {
  const nameItem = useNameItem();
  const [name] = nameItem(item, "craft-name");
  const clickable = onClick !== undefined;
  const showAltname =
    item.altName !== undefined &&
    (item.altName.includes("Collectible") ||
      item.altName.includes("Commodity") ||
      item.isHoldable());

  function handleClick() {
    if (onClick) {
      onClick(item);
    }
  }

  return (
    <button
      onClick={handleClick}
      className={clsx(
        clickable &&
          "relative overflow-hidden border-y-2 border-transparent bg-transparent transition-all hover:bg-black/20 active:bg-black/30",
        !bigger && "block h-[64px] w-full pl-[2px] pr-4",
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
            "overflow-hidden bg-gradient-to-b from-neutral-500/10 to-neutral-300/10 group-hover:from-neutral-500 group-hover:to-neutral-300",
            !bigger && "aspect-[1.333] w-[82px]",
            bigger && "m-auto h-32"
          )}
          item={item}
          key={item.image}
        />
        <div
          className={clsx("w-0 min-w-0 flex-1 text-left", !bigger && "ml-4")}
        >
          <div style={{ color: ignoreRarityColor ? undefined : item.rarity }}>
            <TextSlider text={name} />
          </div>
          {showAltname && item.altName !== undefined && (
            <TextSlider
              className="text-sm text-neutral-400"
              text={item.altName}
            />
          )}
        </div>
      </div>
    </button>
  );
}
