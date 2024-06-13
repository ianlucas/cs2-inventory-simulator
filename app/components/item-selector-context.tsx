/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useContext,
  useState
} from "react";
import { ClientOnly } from "remix-utils/client-only";
import { useWatch } from "~/components/hooks/use-watch";
import { TransformedInventoryItems } from "~/utils/inventory-transform";

export interface ItemSelectorContextProps {
  items: TransformedInventoryItems;
  readOnly?: boolean;
  type:
    | "apply-item-patch"
    | "apply-item-sticker"
    | "deposit-to-storage-unit"
    | "inspect-storage-unit"
    | "rename-item"
    | "retrieve-from-storage-unit"
    | "scrape-sticker"
    | "swap-items-stattrak"
    | "unlock-case";
  uid: number;
}

const ItemSelectorContext = createContext<{
  itemSelector: ItemSelectorContextProps | undefined;
  setItemSelector: Dispatch<
    SetStateAction<ItemSelectorContextProps | undefined>
  >;
}>(null!);

export function useItemSelectorContext() {
  return useContext(ItemSelectorContext);
}

export function useItemSelector() {
  const { itemSelector, setItemSelector } = useItemSelectorContext();
  return [itemSelector, setItemSelector] as const;
}

export function useItemSelectorScrollTopHandler<T>(dependency: T) {
  useWatch((oldState, newState) => {
    if (
      (oldState === undefined && newState !== undefined) ||
      (oldState !== undefined && newState === undefined)
    ) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, dependency);
}

export function ItemSelectorProvider({ children }: { children: ReactNode }) {
  const [itemSelector, setItemSelector] = useState<ItemSelectorContextProps>();
  useItemSelectorScrollTopHandler(itemSelector);

  return (
    <ClientOnly
      children={() => (
        <ItemSelectorContext.Provider
          value={{
            itemSelector,
            setItemSelector
          }}
        >
          {children}
        </ItemSelectorContext.Provider>
      )}
    />
  );
}
