/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2InventoryItem, CS2Team, ensure } from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { getLoadoutUrlTeam } from "~/loadout-url";
import {
  LoadoutGroup,
  LoadoutSideSlot,
  LoadoutSlot,
  LoadoutTeam,
  canRemoveSlot,
  canResetSlot,
  canResetSlotFinish,
  createDefaultLoadout,
  createLoadoutItem,
  getEconomyItem,
  getLoadoutItem,
  getSlotGroup,
  isGridSlot,
  isUsableByTeam,
  resolveSideSlot
} from "~/shared/loadout";
import { getDefaultWeapon } from "~/shared/loadout-defaults";
import { playSound } from "~/sound.client";
import { useInventory, useTranslate } from "./app-context";
import { useInspectItem } from "./hooks/use-inspect-item";
import { useScrollToTopOnChange } from "./hooks/use-inventory-filter-state";
import { useKeyRelease } from "./hooks/use-key-release";
import { LoadoutDropTarget, useLoadoutDrag } from "./hooks/use-loadout-drag";
import { useLoadouts } from "./hooks/use-loadouts";
import { InspectInventoryItem } from "./inspect-item";
import { LoadoutItemImage } from "./loadout-item-image";
import { LoadoutItems } from "./loadout-items";
import { LoadoutFilter, LoadoutItemsFilter } from "./loadout-items-filter";
import { LoadoutSlotMenuEntry } from "./loadout-slot-tile";
import { LoadoutTeamPanel } from "./loadout-team-panel";
import { LoadoutToolbar } from "./loadout-toolbar";
import { Presence } from "./presence";

const ALL_ITEMS: LoadoutFilter = { group: "all", modelKey: "all" };

const NONE = "none";

let lastViewed: { id: string; team: LoadoutTeam } | undefined;

export function LoadoutEditor() {
  const translate = useTranslate();
  const [inventory] = useInventory();
  const {
    loadouts: userLoadouts,
    place,
    removeSlot,
    resetSlot,
    resetSlotFinish
  } = useLoadouts();
  const [searchParams, setSearchParams] = useSearchParams();
  const id = searchParams.get("id");
  const [fallback, setFallback] = useState(getFallback);
  if (fallback.id !== id) {
    setFallback(getFallback());
  }
  const [defaultLoadout] = useState(createDefaultLoadout);
  const [team, setTeam] = useState(
    () => fallback.team ?? getLoadoutUrlTeam(searchParams)
  );
  const [filter, setFilter] = useState(ALL_ITEMS);
  const [sorter, setSorter] = useState("newest");
  const [selected, setSelected] = useState<CS2InventoryItem>();
  const [dropped, setDropped] = useState<{
    key: number;
    slots: LoadoutSlot[];
    team: LoadoutTeam;
  }>();
  const { drag, getDragSourceProps, setGhost } = useLoadoutDrag(handleDrop);
  const { closeInspectItem, handleInspectItem, inspectItem, isInspectingItem } =
    useInspectItem();
  const activeItem = drag?.item ?? selected;
  const selectedLoadout = findLoadout();
  const loadout = selectedLoadout?.loadout ?? defaultLoadout;
  const isReadOnly = selectedLoadout === undefined;

  useKeyRelease("Escape", () => {
    // Escape closes the inspect modal instead, keeping the selection.
    if (inspectItem === undefined) {
      setSelected(undefined);
    }
  });
  useScrollToTopOnChange(filter);

  useEffect(() => {
    lastViewed =
      selectedLoadout !== undefined
        ? { id: selectedLoadout.id, team }
        : undefined;
  }, [selectedLoadout, team]);

  function getFallback() {
    const remembered =
      id === null &&
      userLoadouts?.loadouts.some((loadout) => loadout.id === lastViewed?.id)
        ? lastViewed
        : undefined;
    return {
      id,
      loadoutId: remembered?.id ?? userLoadouts?.activeLoadoutId,
      team: remembered?.team
    };
  }

  function findLoadout() {
    const loadouts = userLoadouts?.loadouts ?? [];
    return (
      loadouts.find((loadout) => loadout.id === id) ??
      (id !== NONE
        ? loadouts.find((loadout) => loadout.id === fallback.loadoutId)
        : undefined)
    );
  }

  function selectLoadout(id?: string) {
    setSearchParams({ id: id ?? NONE }, { preventScrollReset: true });
  }

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
      selectedLoadout !== undefined &&
      slot !== undefined &&
      commit(
        slot,
        place(selectedLoadout, team, slot, createLoadoutItem(item))
      ) !== undefined
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
    } else if (
      filter.modelKey !== "all" &&
      !isUsableByTeam(getDefaultWeapon(filter.modelKey), value)
    ) {
      setFilter({ group: filter.group, modelKey: "all" });
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
      getEconomyItem(inventory, ensure(getLoadoutItem(loadout, team, slot)))
        .modelKey
    );
    changeFilter(
      filter.group === group && filter.modelKey === modelKey
        ? { group, modelKey: "all" }
        : { group, modelKey }
    );
  }

  function getSlotMenu(slot: LoadoutSlot): LoadoutSlotMenuEntry[] {
    if (selectedLoadout === undefined) {
      return [];
    }
    return [
      {
        condition: canResetSlot(loadout, inventory, team, slot),
        label: translate(
          isGridSlot(slot)
            ? "LoadoutResetToDefaultWeapon"
            : "LoadoutResetToDefault"
        ),
        onClick: () => commit(slot, resetSlot(selectedLoadout, team, slot))
      },
      {
        condition: canResetSlotFinish(loadout, team, slot),
        label: translate("LoadoutResetToDefaultFinish"),
        onClick: () =>
          commit(slot, resetSlotFinish(selectedLoadout, team, slot))
      },
      {
        condition: canRemoveSlot(loadout, team, slot),
        label: translate("LoadoutUnequip"),
        onClick: () => removeSlot(selectedLoadout, slot)
      }
    ].filter(({ condition }) => condition);
  }

  return (
    <div className="select-none">
      <LoadoutToolbar onSelect={selectLoadout} selected={selectedLoadout} />
      <div className="sticky top-(--header-height) z-10 border-b border-white/10 backdrop-blur-md">
        <div className="border-b border-white/10 bg-linear-to-b from-transparent to-black/25">
          <div
            className={clsx(
              "relative m-auto h-107 w-5xl transition-opacity",
              isReadOnly && "pointer-events-none opacity-50"
            )}
          >
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
          isReadOnly={isReadOnly}
          loadout={selectedLoadout?.loadout}
          onInspect={handleInspectItem}
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
      <Presence present={isInspectingItem(inspectItem)}>
        {isInspectingItem(inspectItem) ? (
          <InspectInventoryItem {...inspectItem} onClose={closeInspectItem} />
        ) : null}
      </Presence>
    </div>
  );
}
