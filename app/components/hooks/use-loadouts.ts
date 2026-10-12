/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ensure } from "@ianlucas/cs2-lib";
import { SyncAction } from "~/data/sync";
import {
  LoadoutItem,
  LoadoutSlot,
  LoadoutTeam,
  place,
  resetSlot,
  resetSlotFinish
} from "~/shared/loadout";
import {
  LoadoutAction,
  UserLoadout,
  applyLoadoutAction,
  getLoadoutsUsingItem
} from "~/shared/user-loadouts";
import { useAppContext, useTranslate } from "../app-context";
import { useSync } from "./use-sync";

type Placement = ReturnType<typeof place>;

export function useLoadouts() {
  const { inventory, loadouts, rules, setLoadouts } = useAppContext();
  const sync = useSync();

  function dispatch(action: LoadoutAction) {
    setLoadouts((state) =>
      applyLoadoutAction(ensure(state), action, {
        inventory,
        maxLoadouts: rules.inventoryMaxLoadouts
      })
    );
    sync(action);
  }

  function dispatchPlacement(placement: Placement, action: LoadoutAction) {
    if (placement !== undefined) {
      dispatch(action);
    }
    return placement;
  }

  return {
    loadouts,
    create(name: string) {
      const id = crypto.randomUUID();
      dispatch({ type: SyncAction.LoadoutCreate, id, name });
      return id;
    },
    delete: (id: string) => dispatch({ type: SyncAction.LoadoutDelete, id }),
    rename: (id: string, name: string) =>
      dispatch({ type: SyncAction.LoadoutRename, id, name }),
    use: (id: string | null) => dispatch({ type: SyncAction.LoadoutUse, id }),
    importEquipped: (id: string) =>
      dispatch({ type: SyncAction.LoadoutImportEquipped, id }),
    place: (
      { id, loadout }: UserLoadout,
      team: LoadoutTeam,
      slot: LoadoutSlot,
      item: LoadoutItem
    ) =>
      dispatchPlacement(place(loadout, inventory, team, slot, item), {
        type: SyncAction.LoadoutPlace,
        id,
        item,
        slot,
        team
      }),
    resetSlot: (
      { id, loadout }: UserLoadout,
      team: LoadoutTeam,
      slot: LoadoutSlot
    ) =>
      dispatchPlacement(resetSlot(loadout, inventory, team, slot), {
        type: SyncAction.LoadoutResetSlot,
        id,
        slot,
        team
      }),
    resetSlotFinish: (
      { id, loadout }: UserLoadout,
      team: LoadoutTeam,
      slot: LoadoutSlot
    ) =>
      dispatchPlacement(resetSlotFinish(loadout, inventory, team, slot), {
        type: SyncAction.LoadoutResetSlotFinish,
        id,
        slot,
        team
      }),
    removeSlot: ({ id }: UserLoadout, slot: LoadoutSlot) =>
      dispatch({ type: SyncAction.LoadoutRemoveSlot, id, slot })
  };
}

export function useLoadoutItemWarning() {
  const { loadouts } = useAppContext();
  const translate = useTranslate();
  return function getLoadoutItemWarning(uid: number) {
    const names =
      loadouts !== undefined
        ? getLoadoutsUsingItem(loadouts, uid).map(({ name }) => name)
        : [];
    return names.length > 0
      ? translate("LoadoutItemInUse", names.join(", "))
      : undefined;
  };
}
