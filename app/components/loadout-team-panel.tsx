/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2Economy,
  CS2EconomyItem,
  CS2ItemType,
  CS2Team
} from "@ianlucas/cs2-lib";
import clsx from "clsx";
import {
  LOADOUT_EQUIPMENT,
  LOADOUT_GRENADES,
  LOADOUT_PRICES,
  getDefaultWeapon
} from "~/shared/loadout-defaults";
import {
  Loadout,
  LoadoutGroup,
  LoadoutSideSlot,
  LoadoutSlot,
  LoadoutTeam,
  canPlace,
  getEconomyItem,
  getGridSlots,
  getLoadoutItem,
  getSideSlots,
  getSlotGroup,
  resolveLoadoutItem,
  resolveSideSlot
} from "~/shared/loadout";
import { LOADOUT_GROUP_LABELS } from "~/shared/loadout-labels";
import { range } from "~/shared/number";
import { useInventory, useTranslate } from "./app-context";
import type { LoadoutDropTarget } from "./hooks/use-loadout-drag";
import { LoadoutAgent } from "./loadout-agent";
import type { LoadoutFilter } from "./loadout-items-filter";
import { LoadoutIcon } from "./loadout-icon";
import { LoadoutSlotMenuEntry, LoadoutSlotTile } from "./loadout-slot-tile";
import { LoadoutUtilityTile } from "./loadout-utility-tile";
import { FitMarquee, Marquee } from "./marquee";

const TEAM_STYLES = {
  [CS2Team.CT]: {
    background:
      "border-r-4 border-[rgb(48_147_234/0.679)] bg-linear-to-l from-[rgb(29_86_135/0.422)] via-[rgb(29_86_135/0.422)] via-75% to-[rgb(5_66_120/0)]",
    color: "text-ct",
    highlight: "bg-ct",
    title: "LoadoutEquipCT",
    unselectedTitle: "opacity-80"
  },
  [CS2Team.T]: {
    background:
      "border-l-4 border-[rgb(214_180_45/0.562)] bg-linear-to-r from-[rgb(100_81_6/0.5)] via-[rgb(100_81_6/0.5)] via-75% to-[rgb(100_81_6/0)]",
    color: "text-t",
    highlight: "bg-t",
    title: "LoadoutEquipT",
    unselectedTitle: "opacity-30"
  }
} as const;

const EMPTY_SLOT_ICONS: Partial<Record<LoadoutSideSlot, string>> = {
  musickit: "/images/vectors/music_kit.svg",
  flair0: "/images/vectors/equipment/flair0.svg",
  spray0: "/images/vectors/equipment/spray0.svg"
};

export function LoadoutTeamPanel({
  activeItem,
  dragTarget,
  dropped,
  filter,
  getSlotMenu,
  isDragging,
  isSelected,
  loadout,
  onClickArea,
  onClickSideSlot,
  onClickSlot,
  onClickTitle,
  team
}: {
  activeItem?: CS2EconomyItem;
  dragTarget?: LoadoutDropTarget;
  dropped?: { key: number; slots: LoadoutSlot[]; team: LoadoutTeam };
  filter: LoadoutFilter;
  getSlotMenu: (slot: LoadoutSlot) => LoadoutSlotMenuEntry[];
  isDragging: boolean;
  isSelected: boolean;
  loadout: Loadout;
  onClickArea: () => void;
  onClickSideSlot: (slot: LoadoutSideSlot) => void;
  onClickSlot: (slot: LoadoutSlot) => void;
  onClickTitle: (group: LoadoutGroup) => void;
  team: LoadoutTeam;
}) {
  const translate = useTranslate();
  const [inventory] = useInventory();
  const styles = TEAM_STYLES[team];
  const isCT = team === CS2Team.CT;
  const agent = getSlotItem("customplayer");
  const isAreaValidTarget =
    isSelected &&
    activeItem !== undefined &&
    resolveSideSlot(team, activeItem) !== undefined;

  function getUtilityName(modelKey: string) {
    switch (modelKey) {
      case "kevlar":
        return translate("LoadoutKevlar");
      case "assaultsuit":
        return translate("LoadoutAssaultSuit");
      case "defuser":
        return translate("LoadoutDefuser");
      case "taser":
        return getDefaultWeapon(modelKey).name;
    }
    return CS2Economy.findItem({ type: CS2ItemType.Utility, modelKey }).name;
  }

  function getSlotItem(slot: LoadoutSlot) {
    const item = getLoadoutItem(loadout, team, slot);
    return item !== undefined ? resolveLoadoutItem(inventory, item) : undefined;
  }

  function getSlotModelKey(slot: LoadoutSlot) {
    const item = getLoadoutItem(loadout, team, slot);
    return item !== undefined
      ? getEconomyItem(inventory, item).modelKey
      : undefined;
  }

  function isFiltered(slot: LoadoutSlot) {
    return (
      filter.group === getSlotGroup(slot) &&
      (filter.modelKey === "all" || getSlotModelKey(slot) === filter.modelKey)
    );
  }

  function getDropKey(slot: LoadoutSlot) {
    return dropped?.team === team && dropped.slots.includes(slot)
      ? dropped.key
      : undefined;
  }

  function renderGridSlot(slot: LoadoutSlot) {
    const modelKey = getSlotModelKey(slot);
    return (
      <LoadoutSlotTile
        caption={
          modelKey !== undefined && (
            <div className="pointer-events-none absolute inset-x-1 bottom-1 flex justify-between text-[10px] opacity-0 transition-opacity duration-150 group-hover/column:opacity-70">
              <span className="text-white">
                {translate("LoadoutPrice", String(LOADOUT_PRICES[modelKey]))}
              </span>
              <span>{getDefaultWeapon(modelKey).name}</span>
            </div>
          )
        }
        className="flex-1"
        disableTooltip={isDragging}
        dropKey={getDropKey(slot)}
        isDropHover={dragTarget?.team === team && dragTarget.slot === slot}
        isFiltered={isFiltered(slot)}
        isValidTarget={
          activeItem !== undefined && canPlace(team, slot, activeItem)
        }
        item={getSlotItem(slot)}
        key={slot}
        menu={getSlotMenu(slot)}
        onClick={() => onClickSlot(slot)}
        slot={slot}
        team={team}
        tooltipPlacement={slot.startsWith("rifle") ? "left" : "right"}
      />
    );
  }

  function renderTitle(group: LoadoutGroup) {
    const isActive = filter.group === group;
    return (
      <button
        className={clsx(
          "flex h-5.5 shrink-0 items-center gap-1.5 px-1 text-[13px] uppercase transition-colors",
          isActive ? [styles.highlight, "text-black"] : "hover:text-white"
        )}
        onClick={() => onClickTitle(group)}
      >
        <LoadoutIcon
          className="size-2.5"
          src={
            isActive
              ? "/images/vectors/filter.svg"
              : "/images/vectors/filter_line.svg"
          }
        />
        <Marquee>{translate(LOADOUT_GROUP_LABELS[group])}</Marquee>
      </button>
    );
  }

  function renderUtilityColumn(modelKeys: string[], size: number) {
    return (
      <div className="flex w-11 flex-col gap-1 pt-6.5">
        {modelKeys.map((modelKey) => (
          <LoadoutUtilityTile
            key={modelKey}
            modelKey={modelKey}
            name={getUtilityName(modelKey)}
            tooltipPlacement={isCT ? "right" : "left"}
          />
        ))}
        {range(size - modelKeys.length).map((index) => (
          <div className="flex-1 bg-black/15" key={index} />
        ))}
      </div>
    );
  }

  const area = (
    <div
      className={clsx(
        "group/area flex h-full w-65 shrink-0",
        !isCT && "flex-row-reverse",
        isAreaValidTarget &&
          "outline-2 -outline-offset-2 outline-white outline-dashed"
      )}
      data-loadout-team={team}
      onClick={onClickArea}
    >
      <div
        className={clsx(
          "flex w-16 flex-col items-center justify-center gap-1 transition-opacity duration-250",
          !isSelected && "opacity-30"
        )}
      >
        {getSideSlots(team).map((slot) => (
          <LoadoutSlotTile
            className="size-12 shrink-0"
            disableTooltip={isDragging}
            dropKey={getDropKey(slot)}
            emptyIcon={EMPTY_SLOT_ICONS[slot]}
            imageClassName="py-1.5"
            isFiltered={isSelected && filter.group === slot}
            item={getSlotItem(slot)}
            key={slot}
            menu={isSelected ? getSlotMenu(slot) : []}
            onClick={(event) => {
              event.stopPropagation();
              onClickSideSlot(slot);
            }}
            team={team}
          />
        ))}
      </div>
      <div className="relative flex-1">
        {agent !== undefined && (
          <LoadoutAgent
            className={clsx(
              "size-full transition-[opacity,filter] duration-250",
              !isSelected &&
                "opacity-50 brightness-50 group-hover/area:opacity-60 group-hover/area:brightness-80"
            )}
            item={agent}
          />
        )}
        <div
          className={clsx(
            "absolute top-3 left-1/2 w-max max-w-39 -translate-x-1/2 rounded-[3px] border px-1.5 py-0.5 text-[15px] font-bold whitespace-nowrap italic transition-all duration-250",
            isSelected
              ? [styles.highlight, "border-transparent text-black"]
              : [styles.unselectedTitle, "group-hover/area:opacity-60"]
          )}
        >
          {/* Room for the last italic letter, which leans past the text. */}
          <FitMarquee className="-mr-1" textClassName="pr-1">
            {translate(styles.title)}
          </FitMarquee>
        </div>
      </div>
    </div>
  );

  const grid = (
    <div
      className={clsx(
        "flex h-full w-125 shrink-0 gap-1.5 px-2 py-3.5 transition-opacity duration-250",
        !isSelected && "pointer-events-none opacity-0"
      )}
    >
      {renderUtilityColumn(LOADOUT_EQUIPMENT[team], 4)}
      <div className="group/column flex w-30 flex-col gap-1">
        {renderTitle("secondary0")}
        {renderGridSlot("secondary0")}
        {renderTitle("secondary")}
        {getGridSlots("secondary").slice(1).map(renderGridSlot)}
      </div>
      <div className="group/column ml-1.5 flex w-30 flex-col gap-1">
        {renderTitle("smg")}
        {getGridSlots("smg").map(renderGridSlot)}
      </div>
      <div className="group/column ml-1.5 flex w-30 flex-col gap-1">
        {renderTitle("rifle")}
        {getGridSlots("rifle").map(renderGridSlot)}
      </div>
      {renderUtilityColumn(LOADOUT_GRENADES[team], 5)}
    </div>
  );

  return (
    <div
      className={clsx(
        "font-display absolute top-0 flex h-full w-191",
        styles.color,
        isCT ? "left-0" : "right-0",
        isSelected ? "z-2" : "z-1"
      )}
    >
      <div
        className={clsx(
          "pointer-events-none absolute inset-0 transition-opacity duration-250",
          styles.background,
          !isSelected && "opacity-0"
        )}
      />
      {isCT ? (
        <>
          {area}
          {grid}
        </>
      ) : (
        <>
          {grid}
          {area}
        </>
      )}
    </div>
  );
}
