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
import { useInventoryFilterState } from "~/components/hooks/use-inventory-filter-state";
import { useInventoryState } from "~/components/hooks/use-inventory-state";
import { useLocalization } from "~/components/hooks/use-localization";
import { SyncAction } from "~/data/sync";
import { clientGlobals } from "~/globals";
import type { loader } from "~/root";
import { pushToSync, sync } from "~/sync";
import { updateEconomyLanguage } from "~/utils/economy";
import { getFreeItemsToDisplay, parseInventory } from "~/utils/inventory";
import {
  cacheInventoryData,
  getCachedInventoryData,
  getSanitizedCachedInventoryData
} from "~/utils/inventory-cached-data";
import {
  TransformedInventoryItems,
  sortItemsByEquipped,
  transform
} from "~/utils/inventory-transform";
import { SerializeFrom } from "~/utils/misc";
import { cacheAuthenticatedUserId } from "~/utils/user-cached-data";

const AppContext = createContext<
  {
    inventory: CS2Inventory;
    inventoryFilter: ReturnType<typeof useInventoryFilterState>;
    items: TransformedInventoryItems;
    setInventory: (value: CS2Inventory) => void;
    localization: ReturnType<typeof useLocalization>;
  } & SerializeFrom<typeof loader>
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

export function useLocalizationChecksum() {
  return useAppContext().localization.checksum;
}

export function AppProvider({
  children,
  preferences,
  rules,
  localization: { checksum },
  user
}: Omit<
  ContextType<typeof AppContext>,
  "inventory" | "inventoryFilter" | "items" | "localization" | "setInventory"
> & {
  children: ReactNode;
  localization: {
    checksum: string;
  };
}) {
  const inventorySpec = {
    data: user?.inventory
      ? parseInventory(user?.inventory)
      : rules.appCacheInventory
        ? getCachedInventoryData()
        : undefined,
    maxItems: rules.inventoryMaxItems,
    storageUnitMaxItems: rules.inventoryStorageUnitMaxItems
  } satisfies Partial<CS2InventorySpec>;
  const [inventory, setInventory, reactSetInventory] = useInventoryState(
    () => new CS2Inventory(inventorySpec)
  );
  const inventoryFilter = useInventoryFilterState();
  const localization = useLocalization({
    checksum,
    language: preferences.language
  });

  useEffect(() => {
    clientGlobals.assetsBaseUrl = rules.assetsBaseUrl;
  }, [rules.assetsBaseUrl]);

  useEffect(() => {
    cacheInventoryData(inventory.stringify());
  }, [inventory]);

  useEffect(() => {
    if (user !== undefined) {
      if (rules.appCacheInventory && user.inventory === null) {
        const cachedData = getSanitizedCachedInventoryData();
        if (cachedData !== undefined) {
          pushToSync({
            type: SyncAction.AddFromCache,
            data: cachedData
          });
          setInventory(
            new CS2Inventory({
              ...inventorySpec,
              data: cachedData
            })
          );
        }
      }
      cacheAuthenticatedUserId(user.id);
      sync.syncedAt = user.syncedAt.getTime();
    }
  }, [user]);

  useEffect(() => {
    updateEconomyLanguage(localization.items);
    reactSetInventory(
      (inventory) =>
        new CS2Inventory({
          ...inventorySpec,
          data: inventory.getData()
        })
    );
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
        preferences,
        rules,
        setInventory,
        user
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
