/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useLocation } from "react-router";

export function useRootLayout(): {
  footer?: boolean;
  header?: boolean;
  inventory?: boolean;
} {
  const location = useLocation();

  return {
    footer: true,
    header: true,
    inventory: true
  };
}
