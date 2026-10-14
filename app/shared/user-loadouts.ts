/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Inventory, assert, ensure } from "@ianlucas/cs2-lib";
import { SyncAction } from "~/data/sync";
import {
  Loadout,
  LoadoutItem,
  LoadoutSlot,
  LoadoutTeam,
  createDefaultLoadout,
  detachItems,
  getInventoryItemIds,
  getLoadoutItemEquipped,
  importEquipped,
  place,
  removeSlot,
  resetSlot,
  resetSlotFinish
} from "./loadout";

export const LOADOUT_NAME_MAX_LENGTH = 32;

export interface UserLoadout {
  id: string;
  loadout: Loadout;
  name: string;
}

export interface UserLoadouts {
  activeLoadoutId: string | null;
  loadouts: UserLoadout[];
}

interface LoadoutSlotAction {
  id: string;
  slot: LoadoutSlot;
  team: LoadoutTeam;
}

export type LoadoutAction =
  | { type: typeof SyncAction.LoadoutCreate; id: string; name: string }
  | { type: typeof SyncAction.LoadoutRename; id: string; name: string }
  | { type: typeof SyncAction.LoadoutDelete; id: string }
  | { type: typeof SyncAction.LoadoutImportEquipped; id: string }
  | { type: typeof SyncAction.LoadoutUse; id: string | null }
  | ({
      type: typeof SyncAction.LoadoutPlace;
      item: LoadoutItem;
    } & LoadoutSlotAction)
  | ({ type: typeof SyncAction.LoadoutResetSlot } & LoadoutSlotAction)
  | ({ type: typeof SyncAction.LoadoutResetSlotFinish } & LoadoutSlotAction)
  | {
      type: typeof SyncAction.LoadoutRemoveSlot;
      id: string;
      slot: LoadoutSlot;
    };

function findLoadout({ loadouts }: UserLoadouts, id: string) {
  return ensure(loadouts.find((loadout) => loadout.id === id));
}

function updateLoadout(
  state: UserLoadouts,
  id: string,
  update: (loadout: UserLoadout) => UserLoadout
): UserLoadouts {
  const current = findLoadout(state, id);
  return {
    ...state,
    loadouts: state.loadouts.map((loadout) =>
      loadout === current ? update(current) : loadout
    )
  };
}

export function applyLoadoutAction(
  state: UserLoadouts,
  action: LoadoutAction,
  { inventory, maxLoadouts }: { inventory: CS2Inventory; maxLoadouts: number }
): UserLoadouts {
  switch (action.type) {
    case SyncAction.LoadoutCreate:
      assert(state.loadouts.length < maxLoadouts);
      assert(state.loadouts.every(({ id }) => id !== action.id));
      return {
        ...state,
        loadouts: [
          ...state.loadouts,
          { id: action.id, loadout: createDefaultLoadout(), name: action.name }
        ]
      };
    case SyncAction.LoadoutRename:
      return updateLoadout(state, action.id, (current) => ({
        ...current,
        name: action.name
      }));
    case SyncAction.LoadoutDelete:
      findLoadout(state, action.id);
      return {
        activeLoadoutId:
          state.activeLoadoutId !== action.id ? state.activeLoadoutId : null,
        loadouts: state.loadouts.filter(({ id }) => id !== action.id)
      };
    case SyncAction.LoadoutUse:
      if (action.id !== null) {
        findLoadout(state, action.id);
      }
      return { ...state, activeLoadoutId: action.id };
    case SyncAction.LoadoutImportEquipped:
      return updateLoadout(state, action.id, (current) => ({
        ...current,
        loadout: importEquipped(current.loadout, inventory)
      }));
  }
  const { slot } = action;
  return updateLoadout(state, action.id, (current) => {
    const { loadout } = current;
    switch (action.type) {
      case SyncAction.LoadoutPlace:
        return {
          ...current,
          loadout: ensure(
            place(loadout, inventory, action.team, slot, action.item)
          ).loadout
        };
      case SyncAction.LoadoutResetSlot:
        return {
          ...current,
          loadout: ensure(resetSlot(loadout, inventory, action.team, slot))
            .loadout
        };
      case SyncAction.LoadoutResetSlotFinish:
        return {
          ...current,
          loadout: ensure(
            resetSlotFinish(loadout, inventory, action.team, slot)
          ).loadout
        };
      case SyncAction.LoadoutRemoveSlot:
        return { ...current, loadout: removeSlot(loadout, slot) };
    }
  });
}

export function detachRemovedItems(
  state: UserLoadouts,
  itemIds: Map<number, number>,
  previousItemIds: Map<number, number>
): UserLoadouts {
  const loadouts = state.loadouts.map((current) => {
    const loadout = detachItems(current.loadout, itemIds, previousItemIds);
    return loadout !== current.loadout ? { ...current, loadout } : current;
  });
  return loadouts.some((loadout, index) => loadout !== state.loadouts[index])
    ? { ...state, loadouts }
    : state;
}

export function detachMissingItems(
  state: UserLoadouts,
  inventory: CS2Inventory
) {
  return detachRemovedItems(state, getInventoryItemIds(inventory), new Map());
}

export function getActiveLoadout({ activeLoadoutId, loadouts }: UserLoadouts) {
  return loadouts.find(({ id }) => id === activeLoadoutId);
}

export function getLoadoutsUsingItem({ loadouts }: UserLoadouts, uid: number) {
  return loadouts.filter(({ loadout }) =>
    Object.values(getLoadoutItemEquipped(loadout, uid)).some(Boolean)
  );
}
