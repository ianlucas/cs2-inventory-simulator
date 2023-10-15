import { CS_Inventory } from "cslib";
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useState } from "react";
import { retrieveInventoryItems, retrieveUserId, storeInventoryItems } from "~/utils/user";
import { InventoryItem } from "./inventory-item";

const RootContext = createContext<{
  inventory: CS_Inventory;
  setInventory: Dispatch<SetStateAction<CS_Inventory>>;
  requireAuth: boolean;
}>(null!);

export function useRootContext() {
  return useContext(RootContext);
}

export function RootProvider({
  children
}: {
  children: ReactNode;
}) {
  const [inventory, setInventory] = useState(
    new CS_Inventory(
      retrieveInventoryItems()
    )
  );

  useEffect(() => {
    storeInventoryItems(
      inventory
        .getAll()
        .map(({ inventoryItem }) => inventoryItem)
    );
  }, [inventory]);

  return (
    <RootContext.Provider
      value={{
        inventory,
        setInventory,
        requireAuth: retrieveUserId() !== undefined
      }}
    >
      {children}
    </RootContext.Provider>
  );
}
