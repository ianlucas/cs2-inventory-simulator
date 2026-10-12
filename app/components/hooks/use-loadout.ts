/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2BaseInventoryItem } from "@ianlucas/cs2-lib";
import { useState } from "react";
import {
  LoadoutSlot,
  LoadoutTeam,
  createDefaultLoadout,
  place,
  removeSlot,
  resetSlot,
  resetSlotFinish
} from "~/shared/loadout";

type Placement = ReturnType<typeof place>;

export function useLoadout() {
  const [loadout, setLoadout] = useState(createDefaultLoadout);

  function commit(placement: Placement) {
    if (placement !== undefined) {
      setLoadout(placement.loadout);
    }
    return placement;
  }

  return {
    loadout,
    place: (team: LoadoutTeam, slot: LoadoutSlot, item: CS2BaseInventoryItem) =>
      commit(place(loadout, team, slot, item)),
    resetSlot: (team: LoadoutTeam, slot: LoadoutSlot) =>
      commit(resetSlot(loadout, team, slot)),
    resetSlotFinish: (team: LoadoutTeam, slot: LoadoutSlot) =>
      commit(resetSlotFinish(loadout, team, slot)),
    removeSlot: (slot: LoadoutSlot) => setLoadout(removeSlot(loadout, slot))
  };
}
