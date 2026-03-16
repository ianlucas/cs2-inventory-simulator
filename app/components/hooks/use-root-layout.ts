/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useLocation } from "react-router";

/** Only show the inventory UI (item grid) on the /inventory route. */
const INVENTORY_PATH = "/inventory";

export function useRootLayout(): {
  footer?: boolean;
  header?: boolean;
  inventory?: boolean;
} {
  const { pathname } = useLocation();
  const inventory =
    pathname === INVENTORY_PATH || pathname.startsWith(INVENTORY_PATH + "/");

  return {
    footer: true,
    header: true,
    inventory
  };
}
