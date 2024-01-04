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
import { transform } from "~/utils/inventory";

interface ItemSelectorContextProps {
  index: number;
  items: ReturnType<typeof transform>[];
  type:
    | "apply-sticker"
    | "case-opening"
    | "rename-item"
    | "scrape-sticker"
    | "swap-items-stattrak";
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
    <ItemSelectorContext.Provider
      value={{
        itemSelector,
        setItemSelector
      }}
    >
      {children}
    </ItemSelectorContext.Provider>
  );
}
