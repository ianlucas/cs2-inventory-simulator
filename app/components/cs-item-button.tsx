/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Item } from "@ianlucas/cslib";
import clsx from "clsx";
import { getItemName } from "~/utils/economy";
import { CSItemImage } from "./cs-item-image";
import { TextSlider } from "./text-slider";

export function CSItemButton({
  bigger,
  ignoreRarityColor,
  item,
  onClick
}: {
  bigger?: boolean;
  ignoreRarityColor?: boolean;
  item: CS_Item;
  model?: string;
  onClick?: (item: CS_Item) => void;
}) {
  function handleClick() {
    if (onClick) {
      onClick(item);
    }
  }

  const { model, name, quality } = getItemName(item);
  const clickable = onClick !== undefined;
  const showAltname =
    item.altname !== undefined &&
    (item.altname.includes("Collectible") ||
      item.altname.includes("Commodity"));

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
        <CSItemImage
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
            <TextSlider text={name || quality + model} />
          </div>
          {showAltname && item.altname !== undefined && (
            <TextSlider className="text-neutral-400" text={item.altname} />
          )}
        </div>
      </div>
    </button>
  );
}
