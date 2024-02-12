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
  return [state, (state: CS_Inventory) => setState(state.copy())] as const;
}
