/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Inventory } from "@ianlucas/cs2-lib";
import {
  ContextType,
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo
} from "react";
import { useTypedLoaderData } from "remix-typedjson";
import { useInventoryFilterState } from "~/components/hooks/use-inventory-filter-state";
import { useInventoryState } from "~/components/hooks/use-inventory-state";
import { useTranslation } from "~/components/hooks/use-translation";
import type { loader } from "~/root";
import { AddFromCacheAction } from "~/routes/api.action.sync._index";
import { pushToSync, sync } from "~/sync";
import { updateEconomyTranslation } from "~/utils/economy";
import { getFreeItemsToDisplay, parseInventory } from "~/utils/inventory";
import {
  sortItemsByEquipped,
  transform,
  TransformedInventoryItems
} from "~/utils/inventory-transform";
import type { SyncInventoryShape } from "~/utils/shapes.server";
import {
  retrieveInventoryData,
  retrieveUserId,
  storeInventoryData,
  storeUserId
} from "~/utils/user";

const AppContext = createContext<
  {
    inventory: CS2Inventory;
    inventoryFilter: ReturnType<typeof useInventoryFilterState>;
    items: TransformedInventoryItems;
    requireAuth: boolean;
    setInventory: (value: CS2Inventory) => void;
    translation: ReturnType<typeof useTranslation>;
  } & ReturnType<typeof useTypedLoaderData<typeof loader>>
>(null!);

export function useAppContext() {
  return useContext(AppContext);
}

export function useTranslate() {
  return useAppContext().translation.translate;
}

export function useRules() {
  return useAppContext().rules;
}

export function usePreferences() {
  return useAppContext().preferences;
}

export function useInventory() {
  const { inventory, setInventory } = useAppContext();
  return [inventory, setInventory] as const;
}

export function useUser() {
  return useAppContext().user;
}

export function useInventoryItems() {
  return useAppContext().items;
}

export function useInventoryFilter() {
  return useAppContext().inventoryFilter;
}

export function useTranslationChecksum() {
  return useAppContext().translation.checksum;
}

export function AppProvider({
  children,
  logo,
  preferences,
  rules,
  translation: { checksum },
  user
}: Omit<
  ContextType<typeof AppContext>,
  | "inventory"
  | "inventoryFilter"
  | "items"
  | "requireAuth"
  | "setInventory"
  | "translation"
> & {
  children: ReactNode;
  translation: {
    checksum: string;
  };
}) {
  const inventorySpec = {
    items: user?.inventory
      ? parseInventory(user?.inventory)
      : retrieveInventoryData(),
    maxItems: rules.inventoryMaxItems,
    storageUnitMaxItems: rules.inventoryStorageUnitMaxItems
  };
  const [inventory, setInventory] = useInventoryState(
    new CS2Inventory(inventorySpec)
  );
  const inventoryFilter = useInventoryFilterState();
  const translation = useTranslation({
    checksum,
    language: preferences.language
  });

  useEffect(() => {
    storeInventoryData(inventory.stringify());
  }, [inventory]);

  useEffect(() => {
    const data = retrieveInventoryData();
    if (user !== undefined && user.inventory === null && data !== undefined) {
      pushToSync({
        type: AddFromCacheAction,
        items: data as SyncInventoryShape
      });
      setInventory(
        new CS2Inventory({
          data: {
            items: Object.fromEntries(
              Object.entries(data.items).map(([uid, value]) => [
                uid,
                {
                  ...value,
                  equipped: undefined,
                  equippedCT: undefined,
                  equippedT: undefined
                }
              ])
            ),
            version: data.version
          },
          maxItems: rules.inventoryMaxItems,
          storageUnitMaxItems: rules.inventoryStorageUnitMaxItems
        })
      );
    }
    if (user !== undefined) {
      storeUserId(user.id);
      sync.syncedAt = user.syncedAt.getTime();
    }
  }, [user]);

  useEffect(() => {
    updateEconomyTranslation(translation.items);
    setInventory(new CS2Inventory(inventorySpec));
  }, [translation.items]);

  const items = useMemo(
    () =>
      (preferences.hideFilters
        ? sortItemsByEquipped
        : inventoryFilter.sortItems)(
        // Inventory Items
        inventory.getAll().map((item) =>
          transform(item, {
            models: rules.inventoryItemEquipHideModel,
            types: rules.inventoryItemEquipHideType
          })
        ),
        // Default Game Items
        getFreeItemsToDisplay(preferences.hideFreeItems)
      ),
    [
      inventory,
      preferences.hideFreeItems,
      preferences.hideFilters,
      rules.inventoryItemEquipHideModel,
      rules.inventoryItemEquipHideType,
      inventoryFilter.sortItems
    ]
  );

  return (
    <AppContext.Provider
      value={{
        inventory,
        inventoryFilter,
        items,
        logo,
        preferences,
        requireAuth: retrieveUserId() !== undefined,
        rules,
        setInventory,
        translation,
        user
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
