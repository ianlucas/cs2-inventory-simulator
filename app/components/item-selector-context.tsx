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
import { transform } from "~/utils/inventory";

export interface ItemSelectorContextProps {
  items: ReturnType<typeof transform>[];
  type:
    | "apply-item-sticker"
    | "deposit-to-storage-unit"
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

export function ItemSelectorProvider({ children }: { children: ReactNode }) {
  const [itemSelector, setItemSelector] = useState<ItemSelectorContextProps>();

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
