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
import { useInventoryFilters } from "~/hooks/use-inventory-filters";
import { loader } from "~/root";
import { AddFromCacheAction } from "~/routes/api.action.sync._index";
import { translateItems } from "~/utils/economy";
import {
  getFreeItemsToDisplay,
  parseInventory,
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
    inventoryFilters: ReturnType<typeof useInventoryFilters>;
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
  preferences,
  rules,
  user
}: Omit<
  ContextType<typeof RootContext>,
  "inventory" | "requireAuth" | "setInventory" | "items"
> & {
  children: ReactNode;
}) {
  const inventorySpec = {
    items: user?.inventory
      ? parseInventory(user?.inventory)
      : retrieveInventoryItems(),
    maxItems: rules.inventoryMaxItems,
    storageUnitMaxItems: rules.inventoryStorageUnitMaxItems
  };

  const [inventory, setInventory] = useInventory(
    new CS_Inventory(inventorySpec)
  );

  const inventoryFilters = useInventoryFilters();

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
          maxItems: rules.inventoryMaxItems,
          storageUnitMaxItems: rules.inventoryStorageUnitMaxItems
        })
      );
    }
    if (user !== undefined) {
      storeUserId(user.id);
      syncState.syncedAt = user.syncedAt.getTime();
    }
  }, [user]);

  useEffect(() => {
    translateItems(preferences.language, preferences.itemTranslation);
    setInventory(new CS_Inventory(inventorySpec));
  }, [preferences.language]);

  const items = useMemo(
    () =>
      inventoryFilters.sortItems(
        // Inventory Items
        inventory.getAll().map(transform),
        // Default Game Items
        getFreeItemsToDisplay(preferences.hideFreeItems)
      ),
    [inventory, preferences.hideFreeItems, inventoryFilters.sortItems]
  );

  return (
    <RootContext.Provider
      value={{
        inventory,
        inventoryFilters,
        items,
        preferences,
        requireAuth: retrieveUserId() !== undefined,
        rules,
        setInventory,
        user
      }}
    >
      {children}
    </RootContext.Provider>
  );
}
