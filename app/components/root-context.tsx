/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Inventory } from "@ianlucas/cslib";
import {
  ContextType,
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo
} from "react";
import { useTypedLoaderData } from "remix-typedjson";
import { useInventory } from "~/hooks/use-inventory";
import { loader } from "~/root";
import { AddFromCacheAction } from "~/routes/api.action.sync._index";
import { translateItems } from "~/utils/economy";
import {
  getFreeItemsToDisplay,
  parseInventory,
  sortByEquipped,
  sortByName,
  sortByType,
  transform
} from "~/utils/inventory";
import type { SyncInventoryShape } from "~/utils/shapes.server";
import { sync, syncState } from "~/utils/sync";
import {
  retrieveInventoryItems,
  retrieveUserId,
  storeInventoryItems,
  storeUserId
} from "~/utils/user";

const RootContext = createContext<
  {
    inventory: CS_Inventory;
    items: ReturnType<typeof transform>[];
    requireAuth: boolean;
    setInventory: (value: CS_Inventory) => void;
  } & ReturnType<typeof useTypedLoaderData<typeof loader>>
>(null!);

export function useRootContext() {
  return useContext(RootContext);
}

export function RootProvider({
  children,
  env,
  preferences,
  user
}: Omit<
  ContextType<typeof RootContext>,
  "inventory" | "requireAuth" | "setInventory" | "items"
> & {
  children: ReactNode;
}) {
  const [inventory, setInventory] = useInventory(
    new CS_Inventory({
      items: user?.inventory
        ? parseInventory(user?.inventory)
        : retrieveInventoryItems(),
      maxItems: env.inventoryMaxItems,
      storageUnitMaxItems: env.inventoryStorageUnitMaxItems
    })
  );

  useEffect(() => {
    storeInventoryItems(inventory.export());
  }, [inventory]);

  useEffect(() => {
    const items = retrieveInventoryItems();
    if (user !== undefined && user.inventory === null && items.length > 0) {
      sync({
        type: AddFromCacheAction,
        items: items as SyncInventoryShape
      });
      setInventory(
        new CS_Inventory({
          items: items.map((item) => ({
            ...item,
            equipped: undefined,
            equippedCT: undefined,
            equippedT: undefined
          })),
          maxItems: env.inventoryMaxItems,
          storageUnitMaxItems: env.inventoryStorageUnitMaxItems
        })
      );
    }
    if (user !== undefined) {
      storeUserId(user.id);
      syncState.syncedAt = user.syncedAt.getTime();
    }
  }, [user]);

  translateItems(preferences.language, preferences.itemTranslation);

  const items = useMemo(
    () => [
      // Inventory Items
      ...inventory
        .getAll()
        .map(transform)
        .sort(sortByName)
        .sort(sortByType)
        .sort(sortByEquipped),
      // Default Game Items
      ...getFreeItemsToDisplay(preferences.hideFreeItems)
        .sort(sortByName)
        .sort(sortByType)
        .sort(sortByEquipped)
    ],
    [inventory, preferences.language, preferences.hideFreeItems]
  );

  return (
    <RootContext.Provider
      value={{
        env,
        inventory,
        items,
        preferences,
        requireAuth: retrieveUserId() !== undefined,
        setInventory,
        user
      }}
    >
      {children}
    </RootContext.Provider>
  );
}
