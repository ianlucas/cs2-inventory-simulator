import { CS_Inventory } from "cslib";
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState } from "react";

const RootContext = createContext<{
  inventory: CS_Inventory;
  setInventory: Dispatch<SetStateAction<CS_Inventory>>;
}>(null!);

export function useRootContext() {
  return useContext(RootContext);
}

export function RootProvider({
  children
}: {
  children: ReactNode;
}) {
  const [inventory, setInventory] = useState(new CS_Inventory());
  return (
    <RootContext.Provider
      value={{
        inventory,
        setInventory
      }}
    >
      {children}
    </RootContext.Provider>
  );
}
