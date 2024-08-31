/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Inventory } from "@ianlucas/cs2-lib";
import { useState } from "react";

export function useInventoryState(
  initialState: CS2Inventory | (() => CS2Inventory)
) {
  const [state, setState] = useState(initialState);
  return [
    state,
    (state: CS2Inventory) => setState(state.move()),
    () => setState((state) => state.move())
  ] as const;
}
