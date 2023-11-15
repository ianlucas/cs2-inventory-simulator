/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Item, CS_resolveItemImage } from "@ianlucas/cslib";
import clsx from "clsx";
import { useRef } from "react";
import { baseUrl, getCSItemName } from "~/utils/economy";
import { TextSlider } from "./text-slider";

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
  model?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  function handleClick() {
    if (onClick) {
      onClick(csItem);
    }
  }

  const { model, name } = getCSItemName(csItem);
  const clickable = onClick !== undefined;
  const showAltname = csItem.altname !== undefined
    && (csItem.altname.includes("Collectible")
      || csItem.altname.includes("Commodity"));

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
          src={CS_resolveItemImage(baseUrl, csItem)}
          alt={csItem.name}
        />
        <div
          className={clsx("text-left flex-1 w-0 min-w-0", !bigger && "ml-4")}
        >
          <div style={{ color: ignoreRarityColor ? undefined : csItem.rarity }}>
            <TextSlider text={name || model} />
          </div>
          {showAltname && csItem.altname !== undefined && (
            <TextSlider className="text-neutral-400" text={csItem.altname} />
          )}
        </div>
      </div>
    </button>
  );
}
