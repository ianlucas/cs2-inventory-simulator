/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { CS_Economy, CS_Item, CS_resolveItemImage } from "cslib";
import { useRef } from "react";
import { getCSItemName } from "~/utils/economy";

export function CSItemButton({
  bigger,
  ignoreRarityColor,
  csItem,
  onClick
}: {
  bigger?: boolean;
  ignoreRarityColor?: boolean;
  csItem: CS_Item;
  onClick?(item: CS_Item): void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  function handleClick() {
    if (onClick) {
      onClick(csItem);
    }
  }

  const { model, name } = getCSItemName(csItem);
  const clickable = onClick !== undefined;

  return (
    <button
      ref={ref}
      onClick={handleClick}
      className={clsx(
        clickable
          && "relative bg-transparent transition-all hover:bg-black/20 active:bg-black/30 rounded overflow-hidden",
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
        <img
          key={csItem.image}
          draggable={false}
          className={clsx(
            !bigger && "h-[63px] w-[84px]",
            bigger && "m-auto h-32"
          )}
          src={CS_resolveItemImage("/localimage", csItem)}
        />
        <div className={clsx(!bigger && "ml-4")}>
          <div style={{ color: ignoreRarityColor ? undefined : csItem.rarity }}>
            {name || model}
          </div>
        </div>
      </div>
    </button>
  );
}
