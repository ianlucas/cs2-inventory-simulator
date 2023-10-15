import { CS_Inventory } from "cslib";
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useState } from "react";
import type { findRequestUser } from "~/auth.server";
import { ApiSaveCachedInventoryUrl } from "~/routes/api.save-cached-inventory._index";
import { sync } from "~/utils/sync";
import { parseInventory, retrieveInventoryItems, retrieveUserId, storeInventoryItems, storeUserId } from "~/utils/user";

const RootContext = createContext<{
  inventory: CS_Inventory;
  setInventory: Dispatch<SetStateAction<CS_Inventory>>;
  user: Awaited<ReturnType<typeof findRequestUser>>;
  requireAuth: boolean;
}>(null!);

export function useRootContext() {
  return useContext(RootContext);
}

export function RootProvider({
  children,
  maxInventoryItems,
  user
}: {
  children: ReactNode;
  maxInventoryItems: number;
  user: Awaited<ReturnType<typeof findRequestUser>>;
}) {
  const [inventory, setInventory] = useState(
    new CS_Inventory(
      user?.inventory
        ? parseInventory(user?.inventory)
        : retrieveInventoryItems(),
      maxInventoryItems
    )
  );

  useEffect(() => {
    storeInventoryItems(
      inventory.getItems()
    );
  }, [inventory]);

  useEffect(() => {
    const items = retrieveInventoryItems();
    if (
      user !== undefined
      && user.inventory === null
      && items.length > 0
    ) {
      sync(ApiSaveCachedInventoryUrl, items);
      setInventory(new CS_Inventory(items, maxInventoryItems));
    }
    if (user !== undefined) {
      storeUserId(user.id);
    }
  }, [user]);

  return (
    <RootContext.Provider
      value={{
        inventory,
        requireAuth: retrieveUserId() !== undefined,
        setInventory,
        user
      }}
    >
      {children}
    </RootContext.Provider>
  );
}
