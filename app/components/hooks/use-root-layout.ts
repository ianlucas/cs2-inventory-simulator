/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useLocation } from "react-router";

const ROUTES_WITHOUT_INVENTORY = ["/", "/rules"] as const;

export function useRootLayout(): {
  footer?: boolean;
  header?: boolean;
  inventory?: boolean;
} {
  const { pathname } = useLocation();
  const inventory =
    !ROUTES_WITHOUT_INVENTORY.some((path) => pathname === path || pathname.startsWith(path + "/"));

  return {
    footer: true,
    header: true,
    inventory
  };
}
