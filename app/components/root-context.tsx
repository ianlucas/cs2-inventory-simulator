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
import { useInventory } from "~/hooks/use-inventory";
import {
  sortItemsByEquipped,
  useInventoryFilters
} from "~/hooks/use-inventory-filters";
import { useTranslation } from "~/hooks/use-translation";
import { loader } from "~/root";
import { AddFromCacheAction } from "~/routes/api.action.sync._index";
import { translateItems } from "~/utils/economy";
import { getFreeItemsToDisplay, parseInventory } from "~/utils/inventory";
import {
  transform,
  TransformedInventoryItems
} from "~/utils/inventory-transform";
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
    items: TransformedInventoryItems;
    requireAuth: boolean;
    setInventory: (value: CS_Inventory) => void;
    translations: ReturnType<typeof useTranslation>;
  } & ReturnType<typeof useTypedLoaderData<typeof loader>>
>(null!);

export function useRootContext() {
  return useContext(RootContext);
}

export function RootProvider({
  children,
  preferences,
  translations: { checksum },
  rules,
  user
}: Omit<
  ContextType<typeof RootContext>,
  | "inventory"
  | "inventoryFilters"
  | "items"
  | "requireAuth"
  | "setInventory"
  | "translations"
> & {
  children: ReactNode;
  translations: {
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

  const [inventory, setInventory] = useInventory(
    new CS_Inventory(inventorySpec)
  );

  const inventoryFilters = useInventoryFilters();
  const translations = useTranslation({
    checksum,
    language: preferences.language
  });

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
    translateItems(translations.itemsTranslation);
    setInventory(new CS_Inventory(inventorySpec));
  }, [translations.itemsTranslation]);

  const items = useMemo(
    () =>
      (preferences.hideFilters
        ? sortItemsByEquipped
        : inventoryFilters.sortItems)(
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
      inventoryFilters.sortItems
    ]
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
        translations,
        user
      }}
    >
      {children}
    </RootContext.Provider>
  );
}
