/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2Economy,
  CS2Inventory,
  CS2InventorySpec,
  ensure
} from "@ianlucas/cs2-lib";
import {
  ContextType,
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useInventoryFilterState } from "~/components/hooks/use-inventory-filter-state";
import { useInventoryState } from "~/components/hooks/use-inventory-state";
import { useTranslation } from "~/components/hooks/use-translation";
import { SyncAction } from "~/data/sync";
import {
  cacheInventoryData,
  getCachedInventoryData,
  getSanitizedCachedInventoryData
} from "~/inventory-storage";
import type { loader } from "~/root";
import { updateEconomyLanguage } from "~/shared/economy";
import {
  getCharmDetachmentsToDisplay,
  getFreeItemsToDisplay
} from "~/shared/inventory";
import {
  EquippedInventory,
  createEquippedInventory
} from "~/shared/inventory-equipped";
import {
  TransformedInventoryItems,
  sortItemsByEquipped,
  transform
} from "~/shared/inventory-transform";
import { getInventoryItemIds } from "~/shared/loadout";
import { SerializeFrom } from "~/shared/misc";
import {
  UserLoadout,
  UserLoadouts,
  detachMissingItems,
  detachRemovedItems,
  getActiveLoadout
} from "~/shared/user-loadouts";
import { pushToSync, sync } from "~/sync";
import { cacheAuthenticatedUserId } from "~/user-storage";
import { viewerClientAvailability } from "~/viewer-client-availability";

const AppContext = createContext<
  | ({
      activeLoadout: UserLoadout | undefined;
      equipped: EquippedInventory;
      inventory: CS2Inventory;
      inventoryFilter: ReturnType<typeof useInventoryFilterState>;
      items: TransformedInventoryItems;
      loadouts: UserLoadouts | undefined;
      setInventory: (value: CS2Inventory) => void;
      setLoadouts: Dispatch<SetStateAction<UserLoadouts | undefined>>;
      translation: ReturnType<typeof useTranslation>;
    } & SerializeFrom<typeof loader>)
  | null
>(null);

export function useAppContext() {
  return ensure(
    useContext(AppContext),
    "Application context is not available."
  );
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

export function useActiveLoadout() {
  return useAppContext().activeLoadout;
}

/** What the game equips, with the active loadout taking over the inventory. */
export function useEquippedInventory() {
  return useAppContext().equipped;
}

export function AppProvider({
  children,
  preferences,
  rules,
  user
}: Omit<
  NonNullable<ContextType<typeof AppContext>>,
  | "activeLoadout"
  | "equipped"
  | "inventory"
  | "inventoryFilter"
  | "items"
  | "loadouts"
  | "setInventory"
  | "setLoadouts"
  | "translation"
> & {
  children: ReactNode;
}) {
  const inventorySpec = {
    data:
      user?.inventory ??
      (rules.appCacheInventory ? getCachedInventoryData() : undefined),
    maxItems: rules.inventoryMaxItems,
    storageUnitMaxItems: rules.inventoryStorageUnitMaxItems
  } satisfies Partial<CS2InventorySpec>;
  const [inventory, setInventoryState, reactSetInventory] = useInventoryState(
    () => new CS2Inventory(inventorySpec)
  );
  const [loadouts, setLoadouts] = useState(() =>
    user?.loadouts !== undefined
      ? detachMissingItems(user.loadouts, inventory)
      : undefined
  );
  const itemIdsRef = useRef<Map<number, number>>(null);
  itemIdsRef.current ??= getInventoryItemIds(inventory);
  const inventoryFilter = useInventoryFilterState();
  const translation = useTranslation({
    itemLanguage: preferences.itemLanguage ?? preferences.language,
    language: preferences.language
  });

  // Inventory changes mutate the instance in place, so the item ids from the
  // previous change are what tells removed items apart.
  function setInventory(value: CS2Inventory) {
    const previousItemIds = ensure(itemIdsRef.current);
    const itemIds = getInventoryItemIds(value);
    itemIdsRef.current = itemIds;
    setInventoryState(value);
    setLoadouts(
      (state) => state && detachRemovedItems(state, itemIds, previousItemIds)
    );
  }

  useEffect(() => {
    CS2Economy.baseUrl = rules.assetsBaseUrl ?? CS2Economy.baseUrl;
  }, [rules.assetsBaseUrl]);

  useEffect(() => {
    viewerClientAvailability.setServerStatus(rules.viewer);
  }, [rules.viewer]);

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
    updateEconomyLanguage(translation.items);
    reactSetInventory(
      (inventory) =>
        new CS2Inventory({
          ...inventorySpec,
          data: inventory.getData()
        })
    );
  }, [translation.items]);

  const activeLoadout =
    loadouts !== undefined ? getActiveLoadout(loadouts) : undefined;

  const equipped = useMemo(
    () =>
      createEquippedInventory(inventory, activeLoadout?.loadout, {
        models: rules.inventoryItemEquipHideModel,
        types: rules.inventoryItemEquipHideType
      }),
    [
      inventory,
      activeLoadout?.loadout,
      rules.inventoryItemEquipHideModel,
      rules.inventoryItemEquipHideType
    ]
  );

  const items = useMemo(
    () =>
      (preferences.hideFilters
        ? sortItemsByEquipped
        : inventoryFilter.sortItems)(
        // Inventory Items
        inventory
          .getAll()
          .filter(
            (item) => !preferences.hideFreeItems || !item.isCharmDetachment()
          )
          .map((item) => transform(item, equipped.getFlags(item.uid))),
        // Default Game Items
        [
          ...getFreeItemsToDisplay(preferences.hideFreeItems),
          ...getCharmDetachmentsToDisplay(inventory, preferences.hideFreeItems)
        ]
      ),
    [
      equipped,
      inventory,
      preferences.hideFreeItems,
      preferences.hideFilters,
      inventoryFilter.sortItems
    ]
  );

  return (
    <AppContext.Provider
      value={{
        activeLoadout,
        equipped,
        inventory,
        inventoryFilter,
        items,
        loadouts,
        translation: translation,
        preferences,
        rules,
        setInventory,
        setLoadouts,
        user
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
