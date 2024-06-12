/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Inventory, CS2InventorySpec } from "@ianlucas/cs2-lib";
import {
  ContextType,
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo
} from "react";
import { useTypedLoaderData } from "remix-typedjson";
import { useInventoryFilterState } from "~/components/hooks/use-inventory-filter-state";
import { useInventoryState } from "~/components/hooks/use-inventory-state";
import { useLocalization } from "~/components/hooks/use-translation";
import type { loader } from "~/root";
import { AddFromCacheAction } from "~/routes/api.action.sync._index";
import { pushToSync, sync } from "~/sync";
import { updateEconomyTranslation } from "~/utils/economy";
import { getFreeItemsToDisplay, parseInventory } from "~/utils/inventory";
import {
  TransformedInventoryItems,
  sortItemsByEquipped,
  transform
} from "~/utils/inventory-transform";
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
    localization: ReturnType<typeof useLocalization>;
  } & ReturnType<typeof useTypedLoaderData<typeof loader>>
>(null!);

export function useAppContext() {
  return useContext(AppContext);
}

export function useLocalize() {
  return useAppContext().localization.localize;
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
  return useAppContext().localization.checksum;
}

export function AppProvider({
  children,
  logo,
  preferences,
  rules,
  localization: { checksum },
  user
}: Omit<
  ContextType<typeof AppContext>,
  | "inventory"
  | "inventoryFilter"
  | "items"
  | "localization"
  | "requireAuth"
  | "setInventory"
> & {
  children: ReactNode;
  localization: {
    checksum: string;
  };
}) {
  const inventorySpec = {
    data: user?.inventory
      ? parseInventory(user?.inventory)
      : retrieveInventoryData(),
    maxItems: rules.inventoryMaxItems,
    storageUnitMaxItems: rules.inventoryStorageUnitMaxItems
  } satisfies Partial<CS2InventorySpec>;
  const [inventory, setInventory] = useInventoryState(
    new CS2Inventory(inventorySpec)
  );
  const inventoryFilter = useInventoryFilterState();
  const localization = useLocalization({
    checksum,
    language: preferences.language
  });

  useEffect(() => {
    storeInventoryData(inventory.stringify());
  }, [inventory]);

  useEffect(() => {
    const data = retrieveInventoryData();
    if (user !== undefined) {
      if (user.inventory === null && data !== undefined) {
        /** @todo Move this elsewhere? */
        const cacheData = {
          ...data,
          items: Object.fromEntries(
            Object.entries(data.items).map(([uid, value]) => [
              uid,
              {
                ...value,
                equipped: undefined,
                equippedCT: undefined,
                equippedT: undefined,
                statTrak:
                  value.statTrak !== undefined ? (0 as const) : undefined,
                storage:
                  value.storage !== undefined
                    ? Object.fromEntries(
                        Object.entries(value.storage).map(([uid, value]) => [
                          uid,
                          {
                            ...value,
                            statTrak:
                              value.statTrak !== undefined
                                ? (0 as const)
                                : undefined,
                            storage: undefined
                          }
                        ])
                      )
                    : undefined
              }
            ])
          )
        };
        pushToSync({
          type: AddFromCacheAction,
          data: cacheData
        });
        setInventory(
          new CS2Inventory({
            data: cacheData,
            maxItems: rules.inventoryMaxItems,
            storageUnitMaxItems: rules.inventoryStorageUnitMaxItems
          })
        );
      }
      storeUserId(user.id);
      sync.syncedAt = user.syncedAt.getTime();
    }
  }, [user]);

  useEffect(() => {
    updateEconomyTranslation(localization.items);
    setInventory(new CS2Inventory(inventorySpec));
  }, [localization.items]);

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
        localization,
        logo,
        preferences,
        requireAuth: retrieveUserId() !== undefined,
        rules,
        setInventory,
        user
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
