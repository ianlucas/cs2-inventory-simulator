/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2ItemType, CS2Team, ensure } from "@ianlucas/cs2-lib";
import { useNavigate } from "react-router";
import {
  useActiveLoadout,
  useEquippedInventory,
  useInventory
} from "~/components/app-context";
import { SyncAction } from "~/data/sync";
import { getLoadoutUrl } from "~/loadout-url";
import { LoadoutTeam, createLoadoutItem } from "~/shared/loadout";
import { playSound } from "~/sound.client";
import { useLoadouts } from "./use-loadouts";
import { useSync } from "./use-sync";

// Equipping goes to the active loadout wherever it decides the slot, leaving
// the inventory's own equipped items for when the loadout is not in use.
export function useEquipItem() {
  const [inventory, setInventory] = useInventory();
  const activeLoadout = useActiveLoadout();
  const equipped = useEquippedInventory();
  const { place } = useLoadouts();
  const sync = useSync();
  const navigate = useNavigate();

  function equip(uid: number, team?: LoadoutTeam) {
    const item = inventory.get(uid);
    const { slot } = equipped.getEquipOption(item, team);
    playSound(
      item.type === CS2ItemType.MusicKit
        ? "music_equip"
        : "inventory_item_pickup"
    );
    if (slot !== undefined) {
      // Shared slots are the same for either team.
      place(
        ensure(activeLoadout),
        team ?? CS2Team.CT,
        slot,
        createLoadoutItem(item)
      );
    } else {
      setInventory(inventory.equip(uid, team));
      sync({ type: SyncAction.Equip, uid, team });
    }
  }

  function unequip(uid: number, team?: LoadoutTeam) {
    playSound("inventory_item_close");
    setInventory(inventory.unequip(uid, team));
    sync({ type: SyncAction.Unequip, uid, team });
  }

  function viewInLoadout(team?: LoadoutTeam) {
    navigate(getLoadoutUrl(ensure(activeLoadout).id, team));
  }

  return { equip, unequip, viewInLoadout };
}
