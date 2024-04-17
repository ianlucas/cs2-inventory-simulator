/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Inventory } from "@ianlucas/cs2-lib";
import {
  ContextType,
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo
} from "react";
import { useTypedLoaderData } from "remix-typedjson";
import { useInventoryFilterState } from "~/hooks/use-inventory-filter-state";
import { useInventoryState } from "~/hooks/use-inventory-state";
import { useTranslation } from "~/hooks/use-translation";
import type { loader } from "~/root";
import { AddFromCacheAction } from "~/routes/api.action.sync._index";
import { pushToSync, sync } from "~/sync";
import { translateItems } from "~/utils/economy";
import { getFreeItemsToDisplay, parseInventory } from "~/utils/inventory";
import {
  sortItemsByEquipped,
  transform,
  TransformedInventoryItems
} from "~/utils/inventory-transform";
import type { SyncInventoryShape } from "~/utils/shapes.server";
import {
  retrieveInventoryItems,
  retrieveUserId,
  storeInventoryItems,
  storeUserId
} from "~/utils/user";

const AppContext = createContext<
  {
    inventory: CS_Inventory;
    inventoryFilter: ReturnType<typeof useInventoryFilterState>;
    items: TransformedInventoryItems;
    requireAuth: boolean;
    setInventory: (value: CS_Inventory) => void;
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
  preferences,
  translation: { checksum },
  rules,
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
      : retrieveInventoryItems(),
    maxItems: rules.inventoryMaxItems,
    storageUnitMaxItems: rules.inventoryStorageUnitMaxItems
  };
  const [inventory, setInventory] = useInventoryState(
    new CS_Inventory(inventorySpec)
  );
  const inventoryFilter = useInventoryFilterState();
  const translation = useTranslation({
    checksum,
    language: preferences.language
  });

  useEffect(() => {
    storeInventoryItems(inventory.export());
  }, [inventory]);

  useEffect(() => {
    const items = retrieveInventoryItems();
    if (user !== undefined && user.inventory === null && items.length > 0) {
      pushToSync({
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
      sync.syncedAt = user.syncedAt.getTime();
    }
  }, [user]);

  useEffect(() => {
    translateItems(translation.items);
    setInventory(new CS_Inventory(inventorySpec));
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
