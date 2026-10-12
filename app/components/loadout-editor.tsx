/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2InventoryItem, CS2Team, ensure } from "@ianlucas/cs2-lib";
import { useState } from "react";
import {
  LoadoutGroup,
  LoadoutSideSlot,
  LoadoutSlot,
  LoadoutTeam,
  canRemoveSlot,
  canResetSlot,
  canResetSlotFinish,
  getEconomyItem,
  getLoadoutItem,
  getSlotGroup,
  isGridSlot,
  resolveSideSlot
} from "~/shared/loadout";
import { playSound } from "~/sound.client";
import { useTranslate } from "./app-context";
import { useScrollToTopOnChange } from "./hooks/use-inventory-filter-state";
import { useKeyRelease } from "./hooks/use-key-release";
import { useLoadout } from "./hooks/use-loadout";
import { LoadoutDropTarget, useLoadoutDrag } from "./hooks/use-loadout-drag";
import { LoadoutItemImage } from "./loadout-item-image";
import { LoadoutItems } from "./loadout-items";
import { LoadoutFilter, LoadoutItemsFilter } from "./loadout-items-filter";
import { LoadoutSlotMenuEntry } from "./loadout-slot-tile";
import { LoadoutTeamPanel } from "./loadout-team-panel";

const ALL_ITEMS: LoadoutFilter = { group: "all", modelKey: "all" };

export function LoadoutEditor() {
  const translate = useTranslate();
  const { loadout, place, removeSlot, resetSlot, resetSlotFinish } =
    useLoadout();
  const [team, setTeam] = useState<LoadoutTeam>(CS2Team.CT);
  const [filter, setFilter] = useState(ALL_ITEMS);
  const [sorter, setSorter] = useState("newest");
  const [selected, setSelected] = useState<CS2InventoryItem>();
  const [dropped, setDropped] = useState<{
    key: number;
    slots: LoadoutSlot[];
    team: LoadoutTeam;
  }>();
  const { drag, getDragSourceProps, setGhost } = useLoadoutDrag(handleDrop);
  const activeItem = drag?.item ?? selected;

  useKeyRelease("Escape", () => setSelected(undefined));
  useScrollToTopOnChange(filter);

  function commit(slot: LoadoutSlot, placement: ReturnType<typeof place>) {
    if (placement !== undefined) {
      setDropped({
        key: Date.now(),
        slots:
          placement.swappedSlot !== undefined
            ? [slot, placement.swappedSlot]
            : [slot],
        team
      });
    }
    return placement;
  }

  function placeItem(item: CS2InventoryItem, slot?: LoadoutSlot) {
    playSound("inventory_item_putdown");
    if (
      slot !== undefined &&
      commit(slot, place(team, slot, item.asBase())) !== undefined
    ) {
      setSelected(undefined);
    }
  }

  function handleDrop(item: CS2InventoryItem, target?: LoadoutDropTarget) {
    if (target?.team === team) {
      placeItem(item, target.slot ?? resolveSideSlot(team, item));
    }
  }

  function changeFilter(value: LoadoutFilter) {
    setFilter(value);
    if (value.group === "c4" && team === CS2Team.CT) {
      setTeam(CS2Team.T);
    }
  }

  function changeTeam(value: LoadoutTeam) {
    setTeam(value);
    if (filter.group === "c4" && value === CS2Team.CT) {
      setFilter(ALL_ITEMS);
    }
  }

  function handleClickTitle(group: LoadoutGroup) {
    if (filter.group !== group) {
      changeFilter({ group, modelKey: "all" });
    } else {
      changeFilter(
        filter.modelKey !== "all" ? { group, modelKey: "all" } : ALL_ITEMS
      );
    }
  }

  function handleClickArea(areaTeam: LoadoutTeam) {
    if (areaTeam !== team) {
      changeTeam(areaTeam);
    } else if (selected !== undefined) {
      placeItem(selected, resolveSideSlot(team, selected));
    }
  }

  function handleClickSideSlot(areaTeam: LoadoutTeam, slot: LoadoutSideSlot) {
    if (areaTeam !== team || selected !== undefined) {
      handleClickArea(areaTeam);
    } else {
      changeFilter({ group: getSlotGroup(slot), modelKey: "all" });
    }
  }

  function handleClickSlot(slot: LoadoutSlot) {
    if (selected !== undefined) {
      placeItem(selected, slot);
      return;
    }
    const group = getSlotGroup(slot);
    const modelKey = ensure(
      getEconomyItem(ensure(getLoadoutItem(loadout, team, slot))).modelKey
    );
    changeFilter(
      filter.group === group && filter.modelKey === modelKey
        ? { group, modelKey: "all" }
        : { group, modelKey }
    );
  }

  function getSlotMenu(slot: LoadoutSlot): LoadoutSlotMenuEntry[] {
    return [
      {
        condition: canResetSlot(loadout, team, slot),
        label: translate(
          isGridSlot(slot)
            ? "LoadoutResetToDefaultWeapon"
            : "LoadoutResetToDefault"
        ),
        onClick: () => commit(slot, resetSlot(team, slot))
      },
      {
        condition: canResetSlotFinish(loadout, team, slot),
        label: translate("LoadoutResetToDefaultFinish"),
        onClick: () => commit(slot, resetSlotFinish(team, slot))
      },
      {
        condition: canRemoveSlot(loadout, team, slot),
        label: translate("LoadoutUnequip"),
        onClick: () => removeSlot(slot)
      }
    ].filter(({ condition }) => condition);
  }

  return (
    <div className="select-none">
      <div className="sticky top-(--header-height) z-10 border-b border-white/10 backdrop-blur-md">
        <div className="border-b border-white/10 bg-linear-to-b from-transparent to-black/25">
          <div className="relative m-auto h-107 w-5xl">
            {[CS2Team.CT, CS2Team.T].map((value) => (
              <LoadoutTeamPanel
                activeItem={activeItem}
                dragTarget={drag?.target}
                dropped={dropped}
                filter={filter}
                getSlotMenu={getSlotMenu}
                isDragging={drag !== undefined}
                isSelected={value === team}
                key={value}
                loadout={loadout}
                onClickArea={() => handleClickArea(value)}
                onClickSideSlot={(slot) => handleClickSideSlot(value, slot)}
                onClickSlot={handleClickSlot}
                onClickTitle={handleClickTitle}
                team={value}
              />
            ))}
          </div>
        </div>
        <div className="m-auto w-5xl">
          <LoadoutItemsFilter
            filter={filter}
            onChangeFilter={changeFilter}
            onChangeSorter={setSorter}
            sorter={sorter}
            team={team}
          />
        </div>
      </div>
      <div className="m-auto w-5xl">
        <LoadoutItems
          filter={filter}
          getDragSourceProps={getDragSourceProps}
          onSelect={(item) =>
            setSelected(selected?.uid === item.uid ? undefined : item)
          }
          selectedUid={selected?.uid}
          sorter={sorter}
          team={team}
        />
      </div>
      {drag !== undefined && (
        <div
          className="pointer-events-none fixed top-0 left-0 z-50"
          ref={setGhost}
        >
          <LoadoutItemImage
            className="animate-loadout-drag-start aspect-256/192 w-31 -translate-x-1/2 -translate-y-1/4"
            item={drag.item}
          />
        </div>
      )}
    </div>
  );
}
