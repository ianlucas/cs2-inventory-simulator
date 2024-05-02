/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS_Economy,
  CS_InventoryItem,
  CS_MIN_WEAR,
  CS_TEAM_CT,
  CS_TEAM_T
} from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { ComponentProps } from "react";
import { usePreferences } from "./app-context";
import { InventoryItemContents } from "./inventory-item-contents";
import { InventoryItemExterior } from "./inventory-item-exterior";
import { InventoryItemName } from "./inventory-item-name";
import { InventoryItemRarity } from "./inventory-item-rarity";
import { InventoryItemSeed } from "./inventory-item-seed";
import { InventoryItemStatTrak } from "./inventory-item-stattrak";
import { InventoryItemTeams } from "./inventory-item-teams";
import { InventoryItemWear } from "./inventory-item-wear";

export function InventoryItemHover({
  item,
  forwardRef,
  ...props
}: ComponentProps<"div"> & {
  item: CS_InventoryItem;
  forwardRef: typeof props.ref;
}) {
  const { statsForNerds } = usePreferences();
  const { data } = item;
  const isCase = CS_Economy.isCase(data);
  const contentsItem =
    item.caseid !== undefined ? CS_Economy.getById(item.caseid) : item.data;
  const hasContents = contentsItem.contents !== undefined;
  const hasWear = !data.free && CS_Economy.hasWear(data);
  const hasSeed = !data.free && CS_Economy.hasSeed(data);
  const hasAttributes = hasWear || hasSeed;
  const hasStatTrak = item.stattrak !== undefined;
  const wear = item.wear ?? data.wearmin ?? CS_MIN_WEAR;

  // We don't treat graffiti as equippable for a particular team, but in-game it
  // shows as CT or T, if we were to change cs2-lib it would be a breaking
  // change for graffiti logic, so we just update here.
  const teams = data.type === "graffiti" ? [CS_TEAM_CT, CS_TEAM_T] : data.teams;
  const hasTeams = teams !== undefined;

  return (
    <div
      className={clsx(
        "z-20 rounded bg-neutral-900/95 px-6 py-4 text-xs text-white outline-none",
        !isCase && "lg:w-[396px]"
      )}
      ref={forwardRef}
      {...props}
    >
      <InventoryItemName item={item} />
      <div className="mt-2.5 grid items-center gap-1 border-b border-t border-neutral-700/70 p-2 [grid-template-columns:auto_1fr] [grid-template-rows:auto_auto]">
        <InventoryItemRarity data={item.data} />
        {hasWear && <InventoryItemExterior wear={wear} />}
        {hasTeams && <InventoryItemTeams teams={teams} />}
      </div>
      {hasStatTrak && <InventoryItemStatTrak inventoryItem={item} />}
      {hasContents && (
        <InventoryItemContents
          item={contentsItem}
          unlockedItem={!isCase ? data : undefined}
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
