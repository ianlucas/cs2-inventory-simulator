/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Inventory } from "@ianlucas/cs2-lib";
import { prisma } from "~/db.server";
import { inventoryInactivityResetDays } from "~/models/rule.server";
import { getUserInventory, updateUserInventory } from "~/models/user.server";
import { singleton } from "~/singleton.server";
import { DAY_IN_MS, isInactive } from "~/utils/inactivity";

function isInventoryEmpty(rawInventory: string | null) {
  if (rawInventory === null) {
    return true;
  }
  const inventory = CS2Inventory.parse(rawInventory);
  return inventory === undefined || Object.keys(inventory.items).length === 0;
}

export async function resetInactiveInventories() {
  const days = await inventoryInactivityResetDays.get();
  if (days <= 0) {
    return;
  }
  const now = Date.now();
  const users = await prisma.user.findMany({
    select: { id: true, lastSeen: true },
    where: {
      inventory: { not: null },
      lastSeen: { lt: new Date(now - days * DAY_IN_MS) }
    }
  });
  let count = 0;
  for (const { id, lastSeen } of users) {
    try {
      // Re-evaluate per user to honor user/group overwrites: 0 = immune, a
      // larger value = a longer grace period that may not have elapsed yet.
      const userDays = await inventoryInactivityResetDays.for(id).get();
      if (!isInactive(lastSeen, userDays, now)) {
        continue;
      }
      // Skip already-empty inventories so a permanently-inactive user isn't
      // reset (and cache-invalidated) on every sweep.
      if (isInventoryEmpty(await getUserInventory(id))) {
        continue;
      }
      await updateUserInventory(id, new CS2Inventory().stringify());
      count += 1;
    } catch (error) {
      console.error(`Failed to reset inventory for user ${id}.`, error);
    }
  }
  if (count > 0) {
    console.log(
      `Reset ${count} inactive ${count === 1 ? "inventory" : "inventories"}.`
    );
  }
}

export function scheduleInactivityReset() {
  singleton("inactivityReset", () => {
    void resetInactiveInventories();
    return setInterval(() => void resetInactiveInventories(), DAY_IN_MS);
  });
}
