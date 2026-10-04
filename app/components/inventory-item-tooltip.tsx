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
import { has } from "~/shared/misc";
import { usePreferences, useTranslate } from "./app-context";
import { useEconomyPrice } from "./hooks/use-economy-price";
import { InventoryItemTooltipContents } from "./inventory-item-tooltip-contents";
import { ItemDescription } from "./item-description";
import { InventoryItemTooltipExterior } from "./inventory-item-tooltip-exterior";
import { InventoryItemTooltipName } from "./inventory-item-tooltip-name";
import { InventoryItemTooltipPrice } from "./inventory-item-tooltip-price";
import { InventoryItemTooltipRarity } from "./inventory-item-tooltip-rarity";
import { InventoryItemTooltipSeed } from "./inventory-item-tooltip-seed";
import { InventoryItemTooltipStage } from "./inventory-item-tooltip-stage";
import { InventoryItemTooltipStatTrak } from "./inventory-item-tooltip-stattrak";
import { InventoryItemTooltipStyle } from "./inventory-item-tooltip-style";
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
  const translate = useTranslate();
  const { statsForNerds } = usePreferences();
  const economyPrice = useEconomyPrice(item);
  const isContainer = item.isContainer();
  const containerItem =
    item.containerId !== undefined
      ? CS2Economy.getById(item.containerId)
      : item;
  const hasContents = containerItem.isContainer();
  const hasWear = !item.isDefault && item.hasWear();
  const hasSeed = !item.isDefault && item.hasSeed();
  const hasAttributes = hasWear || hasSeed;
  const hasStatTrak = item.statTrak !== undefined;
  const hasStyle = item.hasStyle();
  const upgradeLevel = item.getUpgradeLevel();
  const hasStage = item.getUpgradeLevels().length > 1;
  const isUnsealedGraffiti =
    item.isGraffiti() && item.hasCharges() && !item.isSealed();
  const isCharmDetachment = item.isCharmDetachment();
  const wear = item.getWear();

  // We don't treat graffiti as equippable for a particular team, but in-game it
  // shows as CT or T, if we were to change cs2-lib it would be a breaking
  // change for graffiti logic, so we just update here.
  const teams =
    item.type === CS2ItemType.Graffiti ? CS2_TEAMS_BOTH : item.teams;
  const hasTeams = teams !== undefined;

  return (
    <div
      role="tooltip"
      className={clsx(
        "z-20 max-w-99 rounded-sm bg-neutral-900/95 px-6 py-4 text-xs text-white outline-hidden",
        !isContainer && "lg:w-99"
      )}
      ref={forwardRef}
      {...props}
    >
      <InventoryItemTooltipName item={item} />
      <div className="mt-2.5 grid grid-cols-[auto_1fr] items-center gap-1 border-y border-neutral-700/70 p-2">
        <InventoryItemTooltipRarity item={item} />
        {hasWear && <InventoryItemTooltipExterior wear={wear} />}
        {hasStyle && <InventoryItemTooltipStyle style={item.style} />}
        {hasStage && upgradeLevel !== undefined && (
          <InventoryItemTooltipStage upgradeLevel={upgradeLevel} />
        )}
        {hasTeams && <InventoryItemTooltipTeams teams={teams} />}
      </div>
      {has(item.tournamentDescription) && (
        <p className="mt-4 text-yellow-300">{item.tournamentDescription}</p>
      )}
      {hasStatTrak && (
        <InventoryItemTooltipStatTrak
          type={item.type}
          statTrak={item.statTrak}
        />
      )}
      <ItemDescription item={item} />
      {isUnsealedGraffiti && (
        <p className="mt-4 text-cyan-200/80">
          {translate("ItemGraffitiChargesRemaining", String(item.getCharges()))}
        </p>
      )}
      {isCharmDetachment && (
        <p className="mt-4 text-cyan-200/80">
          {translate("CharmDetachmentsAvailable", String(item.getCharges()))}
        </p>
      )}
      {hasContents && (
        <InventoryItemTooltipContents
          containerItem={containerItem}
          unlockedItem={!isContainer ? item : undefined}
        />
      )}
      {statsForNerds && (hasAttributes || economyPrice.isEnabled) && (
        <div className="mt-2 flex flex-col gap-2">
          {hasWear && <InventoryItemTooltipWear wear={wear} />}
          {hasSeed && <InventoryItemTooltipSeed seed={item.seed} />}
          {economyPrice.isEnabled && (
            <InventoryItemTooltipPrice
              isLoading={economyPrice.isLoading}
              price={economyPrice.price}
            />
          )}
        </div>
      )}
    </div>
  );
}
