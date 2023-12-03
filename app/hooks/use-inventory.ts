/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Inventory } from "@ianlucas/cslib";
import { useState } from "react";

export function useInventory(
  initialState: CS_Inventory | (() => CS_Inventory)
) {
  const [state, setState] = useState(initialState);
  return [
    state,
    (value: CS_Inventory | ((state: CS_Inventory) => CS_Inventory)) =>
      setState(
        (state) =>
          new CS_Inventory(
            (typeof value === "function" ? value(state) : value).getAll(),
            state.limit
          )
      )
  ] as const;
}
