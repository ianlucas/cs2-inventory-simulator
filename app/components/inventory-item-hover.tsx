/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2Economy,
  CS2InventoryItem,
  CS2ItemType,
  CS2ItemTypeValues,
  CS2_MIN_WEAR,
  CS2_TEAMS_BOTH
} from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { ComponentProps } from "react";
import { has } from "~/utils/misc";
import { usePreferences } from "./app-context";
import { InventoryItemContents } from "./inventory-item-contents";
import { InventoryItemExterior } from "./inventory-item-exterior";
import { InventoryItemName } from "./inventory-item-name";
import { InventoryItemRarity } from "./inventory-item-rarity";
import { InventoryItemSeed } from "./inventory-item-seed";
import { InventoryItemStatTrak } from "./inventory-item-stattrak";
import { InventoryItemTeams } from "./inventory-item-teams";
import { InventoryItemWear } from "./inventory-item-wear";

const HOLDABLE_ITEM_TYPES: CS2ItemTypeValues[] = [
  CS2ItemType.Weapon,
  CS2ItemType.Melee,
  CS2ItemType.Gloves
];

export function InventoryItemHover({
  item,
  forwardRef,
  ...props
}: ComponentProps<"div"> & {
  item: CS2InventoryItem;
  forwardRef: typeof props.ref;
}) {
  const { statsForNerds } = usePreferences();
  const data = item;
  const isContainer = data.isContainer();
  const contentsItem =
    item.containerId !== undefined
      ? CS2Economy.getById(item.containerId)
      : item;
  const hasContents = contentsItem.contents !== undefined;
  const hasWear = !data.free && data.hasWear();
  const hasSeed = !data.free && data.hasSeed();
  const hasAttributes = hasWear || hasSeed;
  const hasStatTrak = item.statTrak !== undefined;
  const wear = item.wear ?? data.wearMin ?? CS2_MIN_WEAR;

  // We don't treat graffiti as equippable for a particular team, but in-game it
  // shows as CT or T, if we were to change cs2-lib it would be a breaking
  // change for graffiti logic, so we just update here.
  const teams =
    data.type === CS2ItemType.Graffiti ? CS2_TEAMS_BOTH : data.teams;
  const hasTeams = teams !== undefined;

  return (
    <div
      className={clsx(
        "z-20 max-w-[396px] rounded bg-neutral-900/95 px-6 py-4 text-xs text-white outline-none",
        !isContainer && "lg:w-[396px]"
      )}
      ref={forwardRef}
      {...props}
    >
      <InventoryItemName item={item} />
      <div className="mt-2.5 grid items-center gap-1 border-b border-t border-neutral-700/70 p-2 [grid-template-columns:auto_1fr]">
        <InventoryItemRarity data={item} />
        {hasWear && <InventoryItemExterior wear={wear} />}
        {hasTeams && <InventoryItemTeams teams={teams} />}
      </div>
      {has(data.tournamentDesc) && (
        <p className="mt-4 text-yellow-300">{data.tournamentDesc}</p>
      )}
      {hasStatTrak && <InventoryItemStatTrak inventoryItem={item} />}
      {has(data.desc) && (
        <p className="mt-4 whitespace-pre-wrap text-neutral-300">
          {(data.parent ?? data).desc}
        </p>
      )}
      {data.parent && has(data.desc) && (
        <p
          className={clsx(
            "mt-4 whitespace-pre-wrap text-neutral-300",
            HOLDABLE_ITEM_TYPES.includes(data.type) && "italic"
          )}
        >
          {data.desc}
        </p>
      )}
      {hasContents && (
        <InventoryItemContents
          item={contentsItem}
          unlockedItem={!isContainer ? data : undefined}
        />
      )}
      {statsForNerds && hasAttributes && (
        <div className="mt-2 flex flex-col gap-2">
          {hasWear && <InventoryItemWear wear={wear} />}
          {hasSeed && <InventoryItemSeed inventoryItem={item} />}
        </div>
      )}
    </div>
  );
}
