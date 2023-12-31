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
  useEffect
} from "react";
import type { findRequestUser } from "~/auth.server";
import { useInventory } from "~/hooks/use-inventory";
import { AddFromCacheAction } from "~/routes/api.action.sync._index";
import { translateItems } from "~/utils/economy";
import { parseInventory } from "~/utils/inventory";
import { ExternalInventoryShape } from "~/utils/shapes";
import { sync } from "~/utils/sync";
import {
  retrieveInventoryItems,
  retrieveUserId,
  storeInventoryItems,
  storeUserId
} from "~/utils/user";

const RootContext = createContext<{
  background: string;
  buildLastCommit?: string;
  hideFreeItems: boolean;
  inventory: CS_Inventory;
  itemTranslation: Record<string, string | undefined>;
  language: string;
  maxInventoryItems: number;
  nametagDefaultAllowed: number[];
  requireAuth: boolean;
  setInventory(value: CS_Inventory): void;
  statsForNerds: boolean;
  translation: Record<string, string | undefined>;
  user: Awaited<ReturnType<typeof findRequestUser>>;
}>(null!);

export function useRootContext() {
  return useContext(RootContext);
}

export function RootProvider({
  background,
  buildLastCommit,
  children,
  hideFreeItems,
  itemTranslation,
  language,
  maxInventoryItems,
  nametagDefaultAllowed,
  statsForNerds,
  translation,
  user
}: Omit<
  ContextType<typeof RootContext>,
  "inventory" | "requireAuth" | "setInventory"
> & {
  children: ReactNode;
}) {
  const [inventory, setInventory] = useInventory(
    new CS_Inventory(
      user?.inventory
        ? parseInventory(user?.inventory)
        : retrieveInventoryItems(),
      maxInventoryItems
    )
  );

  useEffect(() => {
    storeInventoryItems(inventory.getAll());
  }, [inventory]);

  useEffect(() => {
    const items = retrieveInventoryItems();
    if (user !== undefined && user.inventory === null && items.length > 0) {
      sync({
        type: AddFromCacheAction,
        items: items as ExternalInventoryShape
      });
      setInventory(
        new CS_Inventory(
          items.map((item) => ({
            ...item,
            equipped: undefined,
            equippedCT: undefined,
            equippedT: undefined
          })),
          maxInventoryItems
        )
      );
    }
    if (user !== undefined) {
      storeUserId(user.id);
    }
  }, [user]);

  translateItems(language, itemTranslation);

  return (
    <RootContext.Provider
      value={{
        background,
        buildLastCommit,
        hideFreeItems,
        inventory,
        itemTranslation,
        language,
        maxInventoryItems,
        nametagDefaultAllowed,
        requireAuth: retrieveUserId() !== undefined,
        setInventory,
        statsForNerds,
        translation,
        user
      }}
    >
      {children}
    </RootContext.Provider>
  );
}
