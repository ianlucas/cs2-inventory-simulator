/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2Economy,
  CS2InventoryItem,
  CS2ItemType,
  CS2_TEAMS_BOTH
} from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { ComponentProps } from "react";
import { has } from "~/utils/misc";
import { usePreferences } from "./app-context";
import { InventoryItemTooltipContents } from "./inventory-item-tooltip-contents";
import { InventoryItemTooltipExterior } from "./inventory-item-tooltip-exterior";
import { InventoryItemTooltipName } from "./inventory-item-tooltip-name";
import { InventoryItemTooltipRarity } from "./inventory-item-tooltip-rarity";
import { InventoryItemTooltipSeed } from "./inventory-item-tooltip-seed";
import { InventoryItemTooltipStatTrak } from "./inventory-item-tooltip-stattrak";
import { InventoryItemTooltipTeams } from "./inventory-item-tooltip-teams";
import { InventoryItemTooltipWear } from "./inventory-item-wear";

export function InventoryItemTooltip({
  item,
  forwardRef,
  ...props
}: ComponentProps<"div"> & {
  item: CS2InventoryItem;
  forwardRef: typeof props.ref;
}) {
  const { statsForNerds } = usePreferences();
  const isContainer = item.isContainer();
  const containerItem =
    item.containerId !== undefined
      ? CS2Economy.getById(item.containerId)
      : item;
  const hasContents = containerItem.isContainer();
  const hasWear = !item.free && item.hasWear();
  const hasSeed = !item.free && item.hasSeed();
  const hasAttributes = hasWear || hasSeed;
  const hasStatTrak = item.statTrak !== undefined;
  const wear = item.getWear();

  // We don't treat graffiti as equippable for a particular team, but in-game it
  // shows as CT or T, if we were to change cs2-lib it would be a breaking
  // change for graffiti logic, so we just update here.
  const teams =
    item.type === CS2ItemType.Graffiti ? CS2_TEAMS_BOTH : item.teams;
  const hasTeams = teams !== undefined;

  const baseDescription = (item.parent ?? item).desc;
  const itemDescription = item.parent !== undefined ? item.desc : undefined;

  return (
    <div
      role="tooltip"
      className={clsx(
        "z-20 max-w-[396px] rounded-sm bg-neutral-900/95 px-6 py-4 text-xs text-white outline-hidden",
        !isContainer && "lg:w-[396px]"
      )}
      ref={forwardRef}
      {...props}
    >
      <InventoryItemTooltipName item={item} />
      <div className="mt-2.5 grid [grid-template-columns:auto_1fr] items-center gap-1 border-t border-b border-neutral-700/70 p-2">
        <InventoryItemTooltipRarity item={item} />
        {hasWear && <InventoryItemTooltipExterior wear={wear} />}
        {hasTeams && <InventoryItemTooltipTeams teams={teams} />}
      </div>
      {has(item.tournamentDesc) && (
        <p className="mt-4 text-yellow-300">{item.tournamentDesc}</p>
      )}
      {hasStatTrak && (
        <InventoryItemTooltipStatTrak
          type={item.type}
          statTrak={item.statTrak}
        />
      )}
      {has(baseDescription) && (
        <p className="mt-4 whitespace-pre-wrap text-neutral-300">
          {baseDescription}
        </p>
      )}
      {has(itemDescription) && (
        <p
          className={clsx(
            "mt-4 whitespace-pre-wrap text-neutral-300",
            item.isPaintable() && "italic"
          )}
        >
          {itemDescription}
        </p>
      )}
      {hasContents && (
        <InventoryItemTooltipContents
          containerItem={containerItem}
          unlockedItem={!isContainer ? item : undefined}
        />
      )}
      {statsForNerds && hasAttributes && (
        <div className="mt-2 flex flex-col gap-2">
          {hasWear && <InventoryItemTooltipWear wear={wear} />}
          {hasSeed && <InventoryItemTooltipSeed seed={item.seed} />}
        </div>
      )}
    </div>
  );
}
