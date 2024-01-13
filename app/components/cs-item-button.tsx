/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Item } from "@ianlucas/cslib";
import clsx from "clsx";
import { getCSItemName } from "~/utils/economy";
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
  onClick?(item: CS_Item): void;
}) {
  function handleClick() {
    if (onClick) {
      onClick(item);
    }
  }

  const { model, name } = getCSItemName(item);
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
          "relative overflow-hidden rounded border-y-2 border-transparent bg-transparent transition-all hover:bg-black/20 active:bg-black/30",
        !bigger && "block h-[64px] w-full px-2",
        bigger && "flex h-full w-full items-center justify-center"
      )}
    >
      <div
        className={clsx(
          "overflow-hidden text-ellipsis whitespace-nowrap",
          !bigger && "flex items-center"
        )}
      >
        <CSItemImage
          className={clsx(
            !bigger && "h-[63px] w-[84px]",
            bigger && "m-auto h-32"
          )}
          item={item}
          key={item.image}
        />
        <div
          className={clsx("w-0 min-w-0 flex-1 text-left", !bigger && "ml-4")}
        >
          <div style={{ color: ignoreRarityColor ? undefined : item.rarity }}>
            <TextSlider text={name || model} />
          </div>
          {showAltname && item.altname !== undefined && (
            <TextSlider className="text-neutral-400" text={item.altname} />
          )}
        </div>
      </div>
    </button>
  );
}
